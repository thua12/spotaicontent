import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [scoresToday, votesLastHour] = await Promise.all([
      prisma.content.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.vote.count({ where: { createdAt: { gte: oneHourAgo } } }),
    ]);

    return NextResponse.json({ scoresToday, votesLastHour });
  } catch {
    return NextResponse.json({ scoresToday: 0, votesLastHour: 0 });
  }
}
