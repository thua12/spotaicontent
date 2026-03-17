import { NextRequest, NextResponse } from "next/server";
import { runContentPullJob } from "@/lib/content-pull";

// Simple secret check — set PULL_SECRET in .env.local
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-pull-secret");
  if (!process.env.PULL_SECRET || secret !== process.env.PULL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runContentPullJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Job failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Allow GET for easy manual testing in browser (dev only)
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Use POST in production" }, { status: 405 });
  }
  return POST(req);
}
