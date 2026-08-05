import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { resolveCategory } from "@/lib/categoryValidation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const box = await prisma.box.findUnique({
    where: { id },
    select: { id: true, quantityTotal: true, quantityLeft: true, store: { select: { ownerId: true, industry: true } } },
  });
  if (!box) return NextResponse.json({ error: "Không tìm thấy box" }, { status: 404 });
  if (box.store.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, description, image, categoryId, priceOriginal, priceSale, quantityTotal, pickupStart, pickupEnd, date } = body;

  if (!name || !image || !priceOriginal || !priceSale || !quantityTotal || !pickupStart || !pickupEnd || !date) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  const categoryResult = await resolveCategory(categoryId, box.store.industry);
  if (!categoryResult.ok) {
    return NextResponse.json({ error: categoryResult.error }, { status: 400 });
  }

  if (Number(priceSale) >= Number(priceOriginal)) {
    return NextResponse.json({ error: "Giá bán phải nhỏ hơn giá gốc" }, { status: 400 });
  }
  if (pickupEnd <= pickupStart) {
    return NextResponse.json({ error: "Giờ kết thúc phải sau giờ bắt đầu" }, { status: 400 });
  }

  const newQtyTotal = Number(quantityTotal);
  const sold = box.quantityTotal - box.quantityLeft;
  if (newQtyTotal < sold) {
    return NextResponse.json({ error: `Số lượng không thể nhỏ hơn số đã bán (${sold})` }, { status: 400 });
  }
  const newQtyLeft = newQtyTotal - sold;

  await prisma.box.update({
    where: { id },
    data: {
      name,
      description:   description || null,
      image,
      categoryId:    categoryResult.categoryId,
      priceOriginal: Number(priceOriginal),
      priceSale:     Number(priceSale),
      quantityTotal: newQtyTotal,
      quantityLeft:  newQtyLeft,
      pickupStart,
      pickupEnd,
      date:          new Date(date),
    },
  });

  return NextResponse.json({ ok: true });
}
