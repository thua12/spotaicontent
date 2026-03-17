/**
 * Display Score determines homepage ranking.
 * Higher score = shown first.
 */

export function freshnessScore(createdAt: Date): number {
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  if (ageHours < 1) return 1.0;
  if (ageHours < 2) return 0.85;
  if (ageHours < 4) return 0.65;
  if (ageHours < 6) return 0.40;
  return 0.10;
}

export function ambiguityScore(aiScore: number): number {
  const s = aiScore;
  if (s >= 46 && s <= 54) return 1.0;
  if ((s >= 40 && s < 46) || (s > 54 && s <= 60)) return 0.85;
  if ((s >= 35 && s < 40) || (s > 60 && s <= 69)) return 0.65;
  if ((s >= 25 && s < 35) || (s > 69 && s <= 79)) return 0.40;
  return 0.20;
}

export function voteGapScore(voteCount: number): number {
  if (voteCount <= 5) return 1.0;
  if (voteCount <= 15) return 0.75;
  if (voteCount <= 30) return 0.50;
  if (voteCount <= 50) return 0.25;
  return 0.10;
}

export function calculateDisplayScore(
  createdAt: Date,
  aiScore: number,
  voteCount: number
): number {
  return (
    freshnessScore(createdAt) * 0.30 +
    ambiguityScore(aiScore) * 0.35 +
    voteGapScore(voteCount) * 0.35
  );
}
