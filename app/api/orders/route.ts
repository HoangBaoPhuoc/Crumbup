import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boxId, quantity = 1 } = await request.json();
  if (!boxId) return NextResponse.json({ error: "boxId required" }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 1) return NextResponse.json({ error: "Số lượng không hợp lệ" }, { status: 400 });

  const box = await prisma.box.findUnique({
    where: { id: boxId },
    select: {
      id: true, storeId: true, priceSale: true, quantityLeft: true, active: true, pickupEnd: true, date: true, name: true,
      store: { select: { ownerId: true } },
    },
  });
  if (!box || !box.active) return NextResponse.json({ error: "Box không tồn tại" }, { status: 404 });
  if (box.quantityLeft < quantity) return NextResponse.json({ error: `Chỉ còn ${box.quantityLeft} box` }, { status: 409 });

  const nowVN   = new Date(Date.now() + 7 * 60 * 60_000);
  const nowHHMM = `${String(nowVN.getUTCHours()).padStart(2, "0")}:${String(nowVN.getUTCMinutes()).padStart(2, "0")}`;
  const todayVN = nowVN.toISOString().slice(0, 10);
  const boxDate = box.date.toISOString().slice(0, 10);
  if (boxDate !== todayVN || box.pickupEnd < nowHHMM)
    return NextResponse.json({ error: "Đã hết giờ nhận hàng cho box này" }, { status: 409 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId: user.id,
        storeId: box.storeId,
        total: box.priceSale * quantity,
        paymentMethod: "bank_transfer",
        items: { create: { boxId, quantity, priceAtTime: box.priceSale } },
      },
    });
    await tx.box.update({ where: { id: boxId }, data: { quantityLeft: { decrement: quantity } } });
    const conversation = await tx.conversation.upsert({
      where: { userId_storeId: { userId: user.id, storeId: box.storeId } },
      update: {},
      create: { userId: user.id, storeId: box.storeId },
      select: { id: true },
    });
    await tx.notification.create({
      data: {
        userId: box.store.ownerId,
        type: "NEW_ORDER",
        orderId: o.id,
        conversationId: conversation.id,
        title: "Đơn hàng mới",
        body: `${dbUser.name} vừa đặt "${box.name}"`,
      },
    });
    return o;
  });

  return NextResponse.json({ orderId: order.id });
}
