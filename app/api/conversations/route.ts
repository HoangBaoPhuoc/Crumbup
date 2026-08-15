import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ChatAttachment } from "@/lib/chatAttachments";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prismaUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  const isBusiness = prismaUser?.role === "BUSINESS";

  const store = isBusiness
    ? await prisma.store.findFirst({ where: { ownerId: user.id }, select: { id: true } })
    : null;

  const conversations = await prisma.conversation.findMany({
    where: isBusiness ? { storeId: store?.id ?? "__none__" } : { userId: user.id },
    select: {
      id: true,
      user: { select: { name: true } },
      store: { select: { name: true, logo: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true, attachmentType: true, attachments: true } },
      _count: { select: { messages: { where: { senderId: { not: user.id }, readAt: null } } } },
    },
  });

  const list = conversations
    .filter((c) => c.messages.length > 0)
    .map((c) => {
      const last = c.messages[0] ?? null;
      const lastAttachments = (last?.attachments as unknown as ChatAttachment[] | null) ?? [];
      const preview = last
        ? (last.body || (
            lastAttachments.length > 0
              ? (lastAttachments.every((a) => a.type === "image") ? "[Hình ảnh]" : "[Tệp đính kèm]")
              : (last.attachmentType === "image" ? "[Hình ảnh]" : "[Tệp đính kèm]")
          ))
        : "";
      return {
        id: c.id,
        otherPartyName: isBusiness ? c.user.name : c.store.name,
        otherPartyLogo: isBusiness ? null : c.store.logo,
        lastMessage: last ? { body: preview, createdAt: last.createdAt, senderId: last.senderId } : null,
        unreadCount: c._count.messages,
      };
    })
    .sort((a, b) => new Date(b.lastMessage!.createdAt).getTime() - new Date(a.lastMessage!.createdAt).getTime());

  return NextResponse.json({ conversations: list });
}
