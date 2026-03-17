import crypto from "crypto";

const SECRET =
  process.env.BADGE_SECRET ?? "aidetect-change-this-secret-in-production";

export type ContentType = "image" | "video" | "text";

export interface BadgeData {
  id: string;
  contentType: ContentType;
  contentIdentifier: string;
  humanScore: number; // 1–99 (never 0 or 100 — certainty is impossible)
  aiScore: number;
  issuedAt: number;
}

/** Clamp score to 1–99 to reflect that absolute certainty is impossible */
export function clampScore(score: number): number {
  return Math.min(99, Math.max(1, Math.round(score)));
}

/** Human-readable interpretation of the spectrum position */
export function scoreLabel(humanScore: number): string {
  if (humanScore >= 85) return "Very likely human";
  if (humanScore >= 65) return "More likely human";
  if (humanScore >= 45) return "Could be either";
  if (humanScore >= 25) return "More likely AI";
  return "Very likely AI";
}

/** Color on the spectrum for a given human score (0–100) */
export function scoreColor(humanScore: number): string {
  // Interpolate red (#ef4444) → amber (#f59e0b) → green (#22c55e)
  if (humanScore >= 50) {
    const t = (humanScore - 50) / 50;
    const r = Math.round(245 + t * (34 - 245));
    const g = Math.round(158 + t * (197 - 158));
    const b = Math.round(11 + t * (94 - 11));
    return `rgb(${r},${g},${b})`;
  } else {
    const t = humanScore / 50;
    const r = Math.round(239 + t * (245 - 239));
    const g = Math.round(68 + t * (158 - 68));
    const b = Math.round(68 + t * (11 - 68));
    return `rgb(${r},${g},${b})`;
  }
}

export function generateBadgeToken(data: BadgeData): string {
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyBadgeToken(token: string): BadgeData | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const encoded = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(encoded)
      .digest("base64url");
    if (sig !== expectedSig) return null;
    return JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as BadgeData;
  } catch {
    return null;
  }
}
