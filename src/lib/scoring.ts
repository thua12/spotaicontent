/** All scores are AI probability: 1–99. Low = human, high = AI. */

export interface Mascot {
  emoji: string;
  name: string;
  tagline: string;
  min: number;
  max: number;
}

export const MASCOTS: Mascot[] = [
  { min: 1,  max: 33, emoji: "👤", name: "Human",  tagline: "Reads like a person wrote it" },
  { min: 34, max: 66, emoji: "🦾", name: "Cyborg", tagline: "We honestly can't tell" },
  { min: 67, max: 99, emoji: "🤖", name: "Robot",  tagline: "Reads like a machine wrote it" },
];

export function getMascot(aiScore: number): Mascot {
  return MASCOTS.find((m) => aiScore >= m.min && aiScore <= m.max) ?? MASCOTS[3];
}

export function scoreLabel(aiScore: number): string {
  if (aiScore <= 33) return "Likely human";
  if (aiScore <= 66) return "Could be either";
  return "Likely AI";
}

/** Clamp to 1–99 — certainty is impossible */
export function clamp(score: number): number {
  return Math.min(99, Math.max(1, Math.round(score)));
}

/** Gradient color: low AI (human) → forest green, high AI → crimson red */
export function scoreColor(aiScore: number): string {
  if (aiScore <= 30) return "#2D6A4F";   // human — forest green
  if (aiScore <= 54) return "#F4A261";   // middle — warm amber
  return "#E63946";                       // AI — crimson red
}

/**
 * Marker % from left on the spectrum bar.
 * Left = red = AI.  Right = green = human.
 * High AI score → near left → low %.
 */
export function markerLeft(aiScore: number): number {
  return 2 + ((100 - aiScore) / 100) * 96;
}

/** Merge algorithm and community scores (50/50 if both exist) */
export function consensusScore(algorithmScore: number, communityScore: number | null): number {
  if (communityScore === null) return algorithmScore;
  return Math.round((algorithmScore + communityScore) / 2);
}
