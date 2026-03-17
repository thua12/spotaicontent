import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const content = await prisma.content.findUnique({
    where: { id },
    select: { submittedById: true },
  });

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (content.submittedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.content.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
