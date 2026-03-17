import * as cheerio from "cheerio";
import crypto from "crypto";
import { prisma } from "./db";
import { calculateDisplayScore } from "./display-score";

// ─── RSS Sources ─────────────────────────────────────────────────────────────

const RSS_SOURCES: Array<{ url: string; section: string; tier: number }> = [
  // News
  { url: "https://feeds.bbci.co.uk/news/rss.xml", section: "news", tier: 1 },
  { url: "https://feeds.reuters.com/reuters/topNews", section: "news", tier: 1 },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", section: "news", tier: 2 },
  { url: "https://www.theguardian.com/world/rss", section: "news", tier: 2 },
  // Entertainment
  { url: "https://variety.com/feed/", section: "entertainment", tier: 3 },
  // Health
  { url: "https://www.healthline.com/rss/health-news", section: "health", tier: 3 },
  // Business
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", section: "business", tier: 2 },
  // Academic
  { url: "https://export.arxiv.org/rss/cs.AI", section: "academic", tier: 2 },
];

// ─── Hacker News ─────────────────────────────────────────────────────────────

async function fetchHackerNews(): Promise<Array<{ url: string; title: string; section: string }>> {
  try {
    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
      signal: AbortSignal.timeout(8000),
    });
    const ids: number[] = await res.json();
    const top20 = ids.slice(0, 20);
    const items = await Promise.allSettled(
      top20.map(async (id) => {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(5000),
        });
        return r.json();
      })
    );
    return items
      .filter((r) => r.status === "fulfilled" && r.value?.url && r.value?.title)
      .map((r) => {
        const v = (r as PromiseFulfilledResult<{ url: string; title: string }>).value;
        return { url: v.url, title: v.title, section: "viral" };
      });
  } catch {
    return [];
  }
}

// ─── Reddit ──────────────────────────────────────────────────────────────────

async function fetchReddit(): Promise<Array<{ url: string; title: string; section: string }>> {
  const subreddits = ["worldnews", "technology", "todayilearned"];
  const results: Array<{ url: string; title: string; section: string }> = [];
  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
        headers: { "User-Agent": "SpotAIContent/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      const posts = data?.data?.children ?? [];
      for (const post of posts) {
        const p = post?.data;
        if (p?.url && p?.title && !p.is_self) {
          results.push({ url: p.url, title: p.title, section: "viral" });
        }
      }
    } catch {
      // skip failed subreddit
    }
  }
  return results;
}

// ─── Text extraction ─────────────────────────────────────────────────────────

async function extractArticleText(url: string): Promise<{ text: string; wordCount: number } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SpotAIContent/1.0; +https://spotaicontent.com)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise
    $("script, style, nav, header, footer, aside, .ad, .advertisement, .cookie-banner").remove();

    // Try article-specific selectors first
    let text = "";
    const selectors = ["article", "main", '[role="main"]', ".article-body", ".post-content", ".entry-content", "#content"];
    for (const sel of selectors) {
      const el = $(sel);
      if (el.length) {
        text = el.text();
        break;
      }
    }
    if (!text || text.trim().length < 200) {
      text = $("body").text();
    }

    // Clean up
    text = text.replace(/\s+/g, " ").trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < 150) return null;
    return { text: text.slice(0, 8000), wordCount }; // cap at 8000 chars for API cost
  } catch {
    return null;
  }
}

// ─── Deduplication ───────────────────────────────────────────────────────────

function hashContent(text: string): string {
  return crypto.createHash("sha256").update(text.slice(0, 200).toLowerCase().replace(/\s+/g, " ")).digest("hex");
}

async function isDuplicate(hash: string): Promise<boolean> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const existing = await prisma.content.findFirst({
    where: { contentHash: hash, createdAt: { gte: sixHoursAgo } },
  });
  return !!existing;
}

// ─── AI Detection ────────────────────────────────────────────────────────────

/** Simple statistical heuristic used when no API key is configured. */
export function statisticalScore(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  // AI phrase fingerprints (overused by LLMs)
  const aiPhrases = [
    "furthermore", "moreover", "in conclusion", "it is worth noting",
    "it is important to", "delve", "crucial", "straightforward",
    "certainly", "absolutely", "it is clear that", "one must consider",
    "in today's world", "in summary", "to summarize", "needless to say",
    "it goes without saying", "as previously mentioned",
  ];
  const phraseHits = aiPhrases.filter((p) => text.toLowerCase().includes(p)).length;
  const phraseScore = Math.min(phraseHits / 4, 1); // 0-1

  // Sentence length consistency (AI = uniform)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (lengths.length || 1);
  const burstiness = Math.sqrt(variance) / (mean || 1);
  const consistencyScore = Math.max(0, 1 - burstiness / 1.5); // low burstiness = high AI score

  // Lexical diversity (AI = lower diversity)
  const uniqueWords = new Set(words).size;
  const diversityRatio = uniqueWords / (wordCount || 1);
  const diversityScore = Math.max(0, 1 - diversityRatio * 2.5);

  // Combine into 1-99 score
  const raw = phraseScore * 0.40 + consistencyScore * 0.35 + diversityScore * 0.25;
  // Keep in ambiguous zone (35-65) since we're not confident without API
  const clamped = 35 + raw * 30;
  return Math.min(99, Math.max(1, Math.round(clamped)));
}

async function scoreText(text: string): Promise<number> {
  const key = process.env.GPTZERO_API_KEY;
  if (!key || key === "your_gptzero_api_key_here") {
    // No API key — use statistical heuristic
    return statisticalScore(text);
  }
  const { detectText } = await import("./gptzero");
  const result = await detectText(text);
  return Math.min(99, Math.max(1, Math.round(result.aiScore * 100)));
}

// ─── Main Job ─────────────────────────────────────────────────────────────────

export interface PullJobResult {
  attempted: number;
  scored: number;
  skipped: number;
  errors: number;
}

export async function runContentPullJob(): Promise<PullJobResult> {
  const result: PullJobResult = { attempted: 0, scored: 0, skipped: 0, errors: 0 };

  // Collect all URLs to process
  const candidates: Array<{ url: string; title?: string; section: string; tier?: number }> = [];

  // 1. RSS feeds
  try {
    // Dynamic import for rss-parser (ESM compat)
    const { default: RSSParser } = await import("rss-parser");
    const parser = new RSSParser({ timeout: 10000 });
    for (const source of RSS_SOURCES) {
      try {
        const feed = await parser.parseURL(source.url);
        for (const item of (feed.items ?? []).slice(0, 8)) {
          if (item.link) {
            candidates.push({ url: item.link, title: item.title ?? undefined, section: source.section, tier: source.tier });
          }
        }
      } catch {
        // skip failed feed
      }
    }
  } catch {
    // rss-parser not available
  }

  // 2. Hacker News
  const hnItems = await fetchHackerNews();
  candidates.push(...hnItems);

  // 3. Reddit
  const redditItems = await fetchReddit();
  candidates.push(...redditItems);

  // Process candidates (cap at 40 per run to avoid API cost)
  const toProcess = candidates.slice(0, 40);

  for (const candidate of toProcess) {
    result.attempted++;
    try {
      // Extract text
      const extracted = await extractArticleText(candidate.url);
      if (!extracted) { result.skipped++; continue; }

      // Deduplicate
      const hash = hashContent(extracted.text);
      if (await isDuplicate(hash)) { result.skipped++; continue; }

      // Score
      let algorithmScore: number;
      try {
        algorithmScore = await scoreText(extracted.text);
      } catch {
        result.errors++;
        continue;
      }

      // Display score
      const now = new Date();
      const displayScore = calculateDisplayScore(now, algorithmScore, 0);

      // Store
      await prisma.content.create({
        data: {
          contentType: "text",
          url: candidate.url,
          excerpt: (candidate.title ?? extracted.text).slice(0, 300),
          algorithmScore,
          displayScore,
          contentHash: hash,
          wordCount: extracted.wordCount,
          section: candidate.section,
          autoImported: true,
        },
      });

      result.scored++;
    } catch {
      result.errors++;
    }
  }

  // Update display scores for existing content (recalculate freshness + current vote counts)
  try {
    const recentContent = await prisma.content.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
      select: { id: true, createdAt: true, algorithmScore: true, voteCount: true },
    });
    for (const c of recentContent) {
      const newScore = calculateDisplayScore(c.createdAt, c.algorithmScore, c.voteCount);
      await prisma.content.update({ where: { id: c.id }, data: { displayScore: newScore } });
    }
  } catch {
    // non-fatal
  }

  return result;
}
