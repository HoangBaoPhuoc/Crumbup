import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { resolveCategory } from "@/lib/categoryValidation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { ownerId: user.id }, select: { id: true, industry: true } });
  if (!store) return NextResponse.json({ error: "No store" }, { status: 403 });

  const body = await request.json();
  const { name, description, image, categoryId, priceOriginal, priceSale, quantityTotal, pickupStart, pickupEnd, date } = body;

  if (!name || !image || !priceOriginal || !priceSale || !quantityTotal || !pickupStart || !pickupEnd || !date) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  const categoryResult = await resolveCategory(categoryId, store.industry);
  if (!categoryResult.ok) {
    return NextResponse.json({ error: categoryResult.error }, { status: 400 });
  }

  const box = await prisma.box.create({
    data: {
      storeId:       store.id,
      name,
      description:   description || null,
      image:         image || null,
      categoryId:    categoryResult.categoryId,
      priceOriginal: Number(priceOriginal),
      priceSale:     Number(priceSale),
      quantityTotal: Number(quantityTotal),
      quantityLeft:  Number(quantityTotal),
      pickupStart,
      pickupEnd,
      date:          new Date(date),
      active:        true,
    },
  });

  return NextResponse.json({ ok: true, boxId: box.id });
}
