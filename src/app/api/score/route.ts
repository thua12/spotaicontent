import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clamp, getMascot, scoreLabel, consensusScore } from "@/lib/scoring";
import { detectImageFromUrl, detectImageFromBuffer } from "@/lib/hive";
import { detectText } from "@/lib/gptzero";
import { validateApiKey } from "@/lib/api-auth";

// GET /api/score?id=xxx — get score for a content ID
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.ok) return auth.response;
  const { apiKey } = auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const content = await prisma.content.findUnique({
    where: { id },
    include: { _count: { select: { votes: true } } },
  });

  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const algoScore = clamp(content.algorithmScore);
  const isFree = apiKey.tier === "free";

  // Free tier: no community data
  const commScore = isFree
    ? null
    : content.communityScore !== null
    ? Math.round(content.communityScore)
    : null;

  const consensus = consensusScore(algoScore, commScore);
  const mascot = getMascot(consensus);
  const label = scoreLabel(consensus);

  return NextResponse.json({
    id: content.id,
    algorithmScore: algoScore,
    communityScore: commScore,
    consensus,
    mascot: { emoji: mascot.emoji, name: mascot.name },
    label,
    voteCount: isFree ? undefined : content._count.votes,
    section: content.section ?? "general",
    contentType: content.contentType,
    createdAt: content.createdAt,
    ...(isFree && { attribution: "Powered by Spot AI Content — spotaicontent.com" }),
  });
}

// POST /api/score — submit content, run detection, return score
export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.ok) return auth.response;
  const { apiKey } = auth;

  try {
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
      filename = file.name;
      excerpt = file.name;
      const buffer = await file.arrayBuffer();
      const result = await detectImageFromBuffer(buffer, file.name, file.type);
      algorithmScore = clamp(result.aiScore * 100);
    } else {
      const body = await req.json();
      type = body.type;
      section = (body.section ?? "general") as string;

      if (type === "text") {
        const text: string = body.text ?? "";
        if (text.trim().length < 50) {
          return NextResponse.json({ error: "Minimum 50 characters required" }, { status: 400 });
        }
        excerpt = text.slice(0, 300);
        const result = await detectText(text);
        algorithmScore = clamp(result.aiScore * 100);
        sentences = JSON.stringify(result.sentences);
      } else if (type === "image") {
        url = body.url;
        excerpt = url;
        const result = await detectImageFromUrl(url!);
        algorithmScore = clamp(result.aiScore * 100);
      } else {
        return NextResponse.json({ error: "Unsupported type. Use text or image." }, { status: 400 });
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
      },
    });

    const algoScore = clamp(algorithmScore);
    const mascot = getMascot(algoScore);
    const label = scoreLabel(algoScore);
    const isFree = apiKey.tier === "free";

    return NextResponse.json({
      id: record.id,
      algorithmScore: algoScore,
      communityScore: null,
      consensus: algoScore,
      mascot: { emoji: mascot.emoji, name: mascot.name },
      label,
      ...(isFree ? {} : { voteCount: 0 }),
      section,
      ...(isFree && { attribution: "Powered by Spot AI Content — spotaicontent.com" }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
