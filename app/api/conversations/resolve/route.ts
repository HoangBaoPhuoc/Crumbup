import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { storeId, customerId } = body ?? {};

  let userId: string;
  let resolvedStoreId: string;

  if (storeId) {
    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
    if (!store) return NextResponse.json({ error: "Không tìm thấy cửa hàng" }, { status: 404 });
    userId = user.id;
    resolvedStoreId = storeId;
  } else if (customerId) {
    const store = await prisma.store.findFirst({ where: { ownerId: user.id }, select: { id: true } });
    if (!store) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    userId = customerId;
    resolvedStoreId = store.id;
  } else {
    return NextResponse.json({ error: "storeId hoặc customerId là bắt buộc" }, { status: 400 });
  }

  const conversation = await prisma.conversation.upsert({
    where: { userId_storeId: { userId, storeId: resolvedStoreId } },
    update: {},
    create: { userId, storeId: resolvedStoreId },
    select: {
      id: true,
      user: { select: { name: true } },
      store: { select: { name: true } },
    },
  });

  const otherPartyName = storeId ? conversation.store.name : conversation.user.name;
  return NextResponse.json({ conversationId: conversation.id, otherPartyName });
}
