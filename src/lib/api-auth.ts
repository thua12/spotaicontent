import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./db";

export const TIER_LIMITS: Record<string, number> = {
  free: 100,
  developer: 5000,
  publisher: 50000,
};

export type ApiKeyRecord = {
  id: string;
  key: string;
  tier: string;
  callsThisMonth: number;
  totalCalls: number;
};

type ValidResult = { ok: true; apiKey: ApiKeyRecord };
type ErrorResult = { ok: false; response: NextResponse };

/**
 * Validates the Bearer token in the Authorization header.
 * Checks quota, resets monthly counter if needed, increments usage.
 * Returns the ApiKey record on success, or an error NextResponse.
 */
export async function validateApiKey(
  req: NextRequest
): Promise<ValidResult | ErrorResult> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Missing API key. Add header: Authorization: Bearer YOUR_API_KEY",
          docs: "/docs",
        },
        { status: 401 }
      ),
    };
  }

  const apiKey = await prisma.apiKey.findUnique({ where: { key: token } });

  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid API key.", docs: "/docs" },
        { status: 401 }
      ),
    };
  }

  // Monthly reset — if lastResetAt is a previous month, reset counter
  const now = new Date();
  const lastReset = new Date(apiKey.lastResetAt);
  const isNewMonth =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth();

  let callsThisMonth = apiKey.callsThisMonth;
  if (isNewMonth) {
    callsThisMonth = 0;
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { callsThisMonth: 0, lastResetAt: now },
    });
  }

  // Quota check
  const limit = TIER_LIMITS[apiKey.tier] ?? TIER_LIMITS.free;
  if (callsThisMonth >= limit) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Monthly quota exceeded. Your ${apiKey.tier} plan allows ${limit.toLocaleString()} calls/month.`,
          callsThisMonth,
          limit,
          resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
          upgrade: "/dashboard/billing",
        },
        { status: 429 }
      ),
    };
  }

  // Increment usage
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      callsThisMonth: { increment: 1 },
      totalCalls: { increment: 1 },
    },
  });

  return { ok: true, apiKey };
}
