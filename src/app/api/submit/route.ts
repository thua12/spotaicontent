import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clamp } from "@/lib/scoring";
import { detectImageFromUrl, detectImageFromBuffer } from "@/lib/hive";
import { auth } from "@/auth";
import { consumeAnonymousCheck, consumeUserCheck } from "@/lib/check-limit";
import { validateUrl } from "@/lib/validate-url";

const VALID_SECTIONS = new Set(["general","news","entertainment","viral","food","business","academic","creative","health"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg","image/png","image/webp","image/gif"]);

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

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      type = form.get("type") as string;
      section = (form.get("section") as string | null) ?? "general";
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
          if (!res.ok) throw new Error(`Could not fetch URL: ${res.status}`);
          const html = await res.text();
          // Strip HTML tags and collapse whitespace
          text = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (text.length < 50) throw new Error("Not enough readable text found at that URL");
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
        url = body.url;
        excerpt = url;
        // Video detection via Hive async
        const key = process.env.HIVE_API_KEY;
        if (!key) throw new Error("HIVE_API_KEY not configured");
        const submitRes = await fetch("https://api.thehive.ai/api/v2/task/async", {
          method: "POST",
          headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!submitRes.ok) throw new Error(`Hive error: ${submitRes.status}`);
        const submitData = await submitRes.json();
        const taskId = submitData?.status?.[0]?.task_id;
        if (!taskId) throw new Error("No task ID from Hive");
        // Poll
        let hiveResult = null;
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const poll = await fetch(`https://api.thehive.ai/api/v2/task/${taskId}`, {
            headers: { Authorization: `Token ${key}` },
          });
          const pollData = await poll.json();
          if (pollData?.status?.[0]?.status?.code === "completed") { hiveResult = pollData; break; }
        }
        if (!hiveResult) throw new Error("Video analysis timed out");
        type HiveClass = { class: string; score: number };
        const classes: HiveClass[] = hiveResult?.status?.[0]?.response?.output?.[0]?.classes ?? [];
        const aiClass = classes.find((c) => c.class === "ai_generated");
        algorithmScore = clamp((aiClass?.score ?? 0) * 100);
      } else {
        // image URL
        validateUrl(body.url);
        url = body.url;
        excerpt = url;
        const result = await detectImageFromUrl(url!);
        algorithmScore = clamp(result.aiScore * 100);
      }
    }

    const record = await prisma.content.create({
      data: {
        contentType: type,
        url,
        filename,
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
