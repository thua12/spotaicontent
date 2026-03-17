import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const { contentId, body } = await req.json();
  if (!contentId || !body?.trim())
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (body.trim().length > 2000)
    return NextResponse.json({ error: "Comment too long (max 2000 characters)" }, { status: 400 });

  const content = await prisma.content.findUnique({ where: { id: contentId }, select: { id: true } });
  if (!content)
    return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { contentId, userId: session.user.id, body: body.trim() },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json(comment);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  if (!contentId) return NextResponse.json([], { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { contentId },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}
