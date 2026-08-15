import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import {
  IMAGE_EXTENSIONS, FILE_EXTENSIONS, MAX_ATTACHMENTS_PER_MESSAGE, extOf, maxBytesFor,
  type ChatAttachment,
} from "@/lib/chatAttachments";

const MAX_LEN = 2000;

async function getAuthorizedConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      userId: true,
      user: { select: { name: true, avatar: true } },
      store: { select: { ownerId: true, name: true, logo: true, owner: { select: { name: true } } } },
    },
  });
  if (!conversation) return null;

  const isCustomer = conversation.userId === userId;
  const isOwner = conversation.store.ownerId === userId;
  if (!isCustomer && !isOwner) return null;

  return { conversation, isCustomer, isOwner };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedConversation(id, user.id);
  if (!auth) return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true, senderId: true, body: true, createdAt: true, readAt: true,
      attachmentUrl: true, attachmentType: true, attachmentName: true, attachments: true,
    },
  });

  const otherPartyName   = auth.isCustomer ? auth.conversation.store.name : auth.conversation.user.name;
  const otherPartyAvatar = auth.isCustomer ? auth.conversation.store.logo : auth.conversation.user.avatar;

  return NextResponse.json({ currentUserId: user.id, otherPartyName, otherPartyAvatar, messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const auth = await getAuthorizedConversation(id, user.id);
  if (!auth) return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện" }, { status: 404 });

  const body = await request.json();
  const text = typeof body?.body === "string" ? body.body.trim() : "";

  const rawAttachments = Array.isArray(body?.attachments) ? body.attachments : [];
  if (rawAttachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    return NextResponse.json({ error: `Tối đa ${MAX_ATTACHMENTS_PER_MESSAGE} tệp mỗi lần gửi` }, { status: 400 });
  }

  const attachments: ChatAttachment[] = [];
  for (const raw of rawAttachments) {
    const url  = typeof raw?.url === "string" ? raw.url : null;
    const type = raw?.type === "image" || raw?.type === "file" ? raw.type : null;
    const name = typeof raw?.name === "string" ? raw.name.slice(0, 200) : null;
    const size = typeof raw?.size === "number" ? raw.size : null;
    if (!url || !type || !name || size == null) {
      return NextResponse.json({ error: "Tệp đính kèm không hợp lệ" }, { status: 400 });
    }
    const ext = extOf(name);
    const allowedExts = type === "image" ? IMAGE_EXTENSIONS : FILE_EXTENSIONS;
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: `Định dạng không được hỗ trợ: ${name}` }, { status: 400 });
    }
    if (size > maxBytesFor(type)) {
      return NextResponse.json({ error: `Tệp quá lớn: ${name}` }, { status: 400 });
    }
    attachments.push({ url, type, name, size });
  }

  if (!text && attachments.length === 0) return NextResponse.json({ error: "Vui lòng nhập nội dung" }, { status: 400 });
  if (text.length > MAX_LEN) return NextResponse.json({ error: "Tin nhắn quá dài" }, { status: 400 });

  const recipientId = auth.isCustomer ? auth.conversation.store.ownerId : auth.conversation.userId;
  const senderName  = auth.isCustomer ? auth.conversation.user.name : auth.conversation.store.owner.name;

  const imageCount = attachments.filter((a) => a.type === "image").length;
  const fileCount  = attachments.length - imageCount;
  const attachmentPreview = attachments.length === 0 ? ""
    : fileCount === 0 ? (imageCount > 1 ? `[${imageCount} hình ảnh]` : "[Hình ảnh]")
    : imageCount === 0 ? (fileCount > 1 ? `[${fileCount} tệp đính kèm]` : "[Tệp đính kèm]")
    : `[${attachments.length} tệp đính kèm]`;
  const notifPreview = text ? (text.length > 140 ? text.slice(0, 140) + "…" : text) : attachmentPreview;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: id, senderId: user.id, body: text,
        attachments: attachments.length ? (attachments as unknown as Prisma.InputJsonValue) : undefined,
      },
      select: {
        id: true, senderId: true, body: true, createdAt: true, readAt: true,
        attachmentUrl: true, attachmentType: true, attachmentName: true, attachments: true,
      },
    });
    await tx.notification.create({
      data: {
        userId: recipientId,
        type: "NEW_MESSAGE",
        conversationId: id,
        title: `Tin nhắn mới từ ${senderName}`,
        body: notifPreview,
      },
    });
    return created;
  });

  return NextResponse.json({ message });
}
