import { prisma } from "@/lib/db";

export async function getTrustScore(userId: string): Promise<number> {
  const trust = await prisma.trustScore.findUnique({ where: { userId } });
  return trust?.score ?? 50;
}

export async function recalculateTrust(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      votes: true,
      _count: { select: { votes: true, comments: true } },
    },
  });
  if (!user) return;

  const accountAgeMs = Date.now() - user.createdAt.getTime();
  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

  // Score components (0-100)
  const agePts = Math.min(20, Math.floor(accountAgeDays / 7) * 2);
  const activityPts = Math.min(20, user._count.votes * 2 + user._count.comments);
  const profilePts = [user.name, user.email, user.image].filter(Boolean).length * 3;
  const baseTrust = agePts + activityPts + profilePts + 30; // start at 30

  await prisma.trustScore.upsert({
    where: { userId },
    create: {
      userId,
      score: Math.min(100, Math.max(0, baseTrust)),
      accountAge: accountAgeDays,
      voteCount: user._count.votes,
    },
    update: {
      score: Math.min(100, Math.max(0, baseTrust)),
      accountAge: accountAgeDays,
      voteCount: user._count.votes,
    },
  });
}

export function trustLabel(score: number): string {
  if (score >= 70) return "Trusted";
  if (score >= 40) return "Established";
  if (score >= 20) return "New";
  return "Unverified";
}

export function trustColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}
