import { prisma } from "./db";
import { NextRequest } from "next/server";

export const CHECK_LIMITS = {
  anonymous: 3,   // per day, by IP
  free: 3,        // per month, signed-in free users
  pro: 100,       // per month
  unlimited: Infinity,
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Check + consume one anonymous check (by IP, resets daily). Returns true if allowed. */
export async function consumeAnonymousCheck(req: NextRequest): Promise<boolean> {
  const ip = getClientIp(req);
  const date = todayString();

  const record = await prisma.anonymousCheck.upsert({
    where: { ip_date: { ip, date } },
    create: { ip, date, count: 1 },
    update: { count: { increment: 1 } },
  });

  // If after increment we're over limit, reject
  // Note: we increment first to avoid race conditions, then check
  return record.count <= CHECK_LIMITS.anonymous;
}

/** Check + consume one signed-in user check (resets monthly). Returns { allowed, remaining }. */
export async function consumeUserCheck(
  userId: string,
  tier: "free" | "pro" | "unlimited"
): Promise<{ allowed: boolean; checksThisMonth: number; limit: number }> {
  if (tier === "unlimited") {
    return { allowed: true, checksThisMonth: 0, limit: Infinity };
  }

  const limit = tier === "pro" ? CHECK_LIMITS.pro : CHECK_LIMITS.free;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { checksThisMonth: true, lastCheckReset: true },
    });

    if (!user) return { allowed: false, checksThisMonth: 0, limit };

    const now = new Date();
    const lastReset = new Date(user.lastCheckReset);
    const isNewMonth =
      now.getFullYear() !== lastReset.getFullYear() ||
      now.getMonth() !== lastReset.getMonth();

    const checksThisMonth = isNewMonth ? 0 : user.checksThisMonth;

    if (checksThisMonth >= limit) {
      return { allowed: false, checksThisMonth, limit };
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        checksThisMonth: checksThisMonth + 1,
        ...(isNewMonth ? { lastCheckReset: now } : {}),
      },
    });

    return { allowed: true, checksThisMonth: checksThisMonth + 1, limit };
  });
}
