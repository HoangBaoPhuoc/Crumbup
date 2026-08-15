import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { userId: true, store: { select: { ownerId: true } } },
  });
  if (!conversation) return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện" }, { status: 404 });
  if (conversation.userId !== user.id && conversation.store.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  await Promise.all([
    prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: user.id }, readAt: null },
      data: { readAt: now },
    }),
    // Clear the badge notifications tied to this conversation (new message / new
    // order) — Message.readAt alone doesn't drive the unread badge count.
    prisma.notification.updateMany({
      where: { userId: user.id, conversationId: id, readAt: null },
      data: { readAt: now },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
