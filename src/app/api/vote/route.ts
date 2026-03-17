import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { clamp } from "@/lib/scoring";

const VOTE_THRESHOLD = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });

  const { contentId, score, verdict } = await req.json();
  if (!contentId || score == null || !verdict)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const VALID_VERDICTS = ["human", "ai", "unsure"];
  if (!VALID_VERDICTS.includes(verdict))
    return NextResponse.json({ error: "Invalid verdict" }, { status: 400 });

  const content = await prisma.content.findUnique({ where: { id: contentId }, select: { id: true } });
  if (!content)
    return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const clamped = clamp(score);

  await prisma.vote.upsert({
    where: { contentId_userId: { contentId, userId: session.user.id } },
    create: { contentId, userId: session.user.id, score: clamped, verdict },
    update: { score: clamped, verdict },
  });

  // Recompute community score
  const votes = await prisma.vote.findMany({ where: { contentId } });
  const avg = votes.reduce((s, v) => s + v.score, 0) / votes.length;

  await prisma.content.update({
    where: { id: contentId },
    data: {
      voteCount: votes.length,
      communityScore: votes.length >= VOTE_THRESHOLD ? avg : null,
    },
  });

  return NextResponse.json({ ok: true, voteCount: votes.length });
}
