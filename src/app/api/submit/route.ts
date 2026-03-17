import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clamp } from "@/lib/scoring";
import { detectImageFromUrl, detectImageFromBuffer } from "@/lib/hive";
import { auth } from "@/auth";
import { consumeUserCheck } from "@/lib/check-limit";
import { validateUrl } from "@/lib/validate-url";

const VALID_SECTIONS = new Set(["general","news","entertainment","viral","food","business","academic","creative","health"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg","image/png","image/webp","image/gif"]);

function autoTitle(type: string, opts: { filename?: string | null; url?: string | null; text?: string }): string {
  if (type === "text") {
    if (opts.url) {
      try {
        const u = new URL(opts.url);
        const slug = u.pathname.split("/").filter(Boolean).pop() ?? "";
        const readable = slug.replace(/[-_]/g, " ").replace(/\.\w+$/, "").trim();
        const host = u.hostname.replace("www.", "");
        if (readable.length > 3) {
          return readable.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").slice(0, 80);
        }
        return `Article from ${host}`;
      } catch { return "Article"; }
    }
    if (opts.text) {
      const words = opts.text.trim().split(/\s+/).slice(0, 8).join(" ");
      return words.length < opts.text.trim().length ? `${words}…` : words;
    }
    return "Text";
  }
  if (type === "video") {
    if (opts.url) {
      try {
        const host = new URL(opts.url).hostname.replace("www.", "");
        return `Video from ${host}`;
      } catch { return "Video"; }
    }
    return "Video";
  }
  // image
  if (opts.filename) {
    const name = opts.filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
    return name.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").slice(0, 80) || "Image";
  }
  if (opts.url) {
    try {
      const u = new URL(opts.url);
      const slug = u.pathname.split("/").filter(Boolean).pop() ?? "";
      const readable = slug.replace(/[-_]/g, " ").replace(/\.\w+$/, "").trim();
      if (readable.length > 2) return readable.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").slice(0, 80);
      return `Image from ${u.hostname.replace("www.", "")}`;
    } catch { return "Image"; }
  }
  return "Image";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    // ── Auth gate ──────────────────────────────────────────────────────────────
    if (!session?.user?.id) {
      return NextResponse.json({
        error: "Sign in to check content.",
        upgrade: "/api/auth/signin",
      }, { status: 401 });
    }

    // Signed-in user — check monthly limit
    const tier = (session.user as { tier?: string }).tier === "pro" ? "pro"
      : (session.user as { tier?: string }).tier === "unlimited" ? "unlimited"
      : "free";
    const check = await consumeUserCheck(session.user.id, tier);
    if (!check.allowed) {
      return NextResponse.json({
        error: `You've used all ${check.limit} checks this month. Upgrade to Pro for 100 checks/month.`,
        checksThisMonth: check.checksThisMonth,
        limit: check.limit,
        upgrade: "/dashboard/billing",
      }, { status: 429 });
    }
    // ── End gate ───────────────────────────────────────────────────────────────

    const contentType = req.headers.get("content-type") ?? "";
    let type: string;
    let url: string | null = null;
    let filename: string | null = null;
    let excerpt: string | null = null;
    let algorithmScore: number;
    let sentences: string | null = null;

    let section = "general";
    let title: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      type = form.get("type") as string;
      section = (form.get("section") as string | null) ?? "general";
      const rawTitle = form.get("title") as string | null;
      title = rawTitle?.trim().slice(0, 120) || null;
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      if (file.size > MAX_FILE_SIZE)
        return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
      if (!ALLOWED_IMAGE_TYPES.has(file.type))
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      filename = file.name;
      excerpt = file.name;
      const buffer = await file.arrayBuffer();
      const result = await detectImageFromBuffer(buffer, file.name, file.type);
      algorithmScore = clamp(result.aiScore * 100);
    } else {
      const body = await req.json();
      type = body.type;
      const rawSection = (body.section ?? "general") as string;
      section = VALID_SECTIONS.has(rawSection) ? rawSection : "general";
      title = typeof body.title === "string" ? body.title.trim().slice(0, 120) || null : null;

      if (type === "text") {
        let text: string = body.text ?? "";
        if (!text && body.url) {
          // Fetch article text from URL — validate first to prevent SSRF
          validateUrl(body.url);
          url = body.url;
          const res = await fetch(body.url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SpotAIContent/1.0)" },
            signal: AbortSignal.timeout(10000),
          });
          if (res.status === 401 || res.status === 403) {
            throw new Error("This article is behind a login or paywall (e.g. NYTimes, Washington Post). Please copy and paste the article text directly instead.");
          }
          if (res.status === 429) {
            throw new Error("This website is blocking our request. Please copy and paste the article text directly instead.");
          }
          if (!res.ok) {
            throw new Error(`Could not fetch this URL (error ${res.status}). Please copy and paste the text directly instead.`);
          }
          const html = await res.text();
          // Strip HTML tags and collapse whitespace
          text = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (text.length < 50) throw new Error("Not enough readable text found at this URL — it may be paywalled or require a login. Please paste the article text directly instead.");
        }
        if (text.trim().length < 50)
          return NextResponse.json({ error: "Minimum 50 characters required" }, { status: 400 });
        excerpt = (url ?? text).slice(0, 300);

        // Try HF first (free), then GPTZero, then statistical fallback
        let detectionResult: { aiScore: number; sentences?: Array<{ sentence: string; generated_prob: number }> };
        try {
          const { detectTextHF } = await import("@/lib/huggingface");
          const hf = await detectTextHF(text);
          detectionResult = { aiScore: hf.aiScore, sentences: [] };
        } catch {
          try {
            const { detectText } = await import("@/lib/gptzero");
            const gz = await detectText(text);
            detectionResult = { aiScore: gz.aiScore, sentences: gz.sentences };
          } catch {
            // Statistical fallback
            const { statisticalScore } = await import("@/lib/content-pull");
            detectionResult = { aiScore: statisticalScore(text) / 100, sentences: [] };
          }
        }
        algorithmScore = clamp(detectionResult.aiScore * 100);
        sentences = JSON.stringify(detectionResult.sentences ?? []);
      } else if (type === "video") {
        validateUrl(body.url);
        // Block platforms that don't allow direct video access
        const videoHostname = new URL(body.url).hostname.replace("www.", "");
        const blockedPlatforms: Record<string, string> = {
          "youtube.com": "YouTube",
          "youtu.be": "YouTube",
          "tiktok.com": "TikTok",
          "instagram.com": "Instagram",
          "twitter.com": "Twitter/X",
          "x.com": "Twitter/X",
          "facebook.com": "Facebook",
          "fb.watch": "Facebook",
          "vimeo.com": "Vimeo",
        };
        if (blockedPlatforms[videoHostname]) {
          throw new Error(`${blockedPlatforms[videoHostname]} doesn't allow direct video access. Please upload the video file directly instead.`);
        }
        url = body.url;
        excerpt = url;
        throw new Error("Video analysis is not available yet. Please check back soon.");
      } else {
        // image URL
        validateUrl(body.url);
        const imageHostname = new URL(body.url).hostname.replace("www.", "");
        const blockedImagePlatforms: Record<string, string> = {
          "instagram.com": "Instagram",
          "twitter.com": "Twitter/X",
          "x.com": "Twitter/X",
          "facebook.com": "Facebook",
          "tiktok.com": "TikTok",
        };
        if (blockedImagePlatforms[imageHostname]) {
          throw new Error(`${blockedImagePlatforms[imageHostname]} blocks direct image access. Please download the image and upload it directly instead.`);
        }
        url = body.url;
        excerpt = url;
        const result = await detectImageFromUrl(url!);
        algorithmScore = clamp(result.aiScore * 100);
      }
    }

    if (!title) title = autoTitle(type, { filename, url, text: excerpt ?? undefined });

    const record = await prisma.content.create({
      data: {
        contentType: type,
        url,
        filename,
        title,
        excerpt,
        algorithmScore,
        sentences,
        section,
        submittedById: userId as string | undefined,
      },
    });

    return NextResponse.json({ id: record.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
