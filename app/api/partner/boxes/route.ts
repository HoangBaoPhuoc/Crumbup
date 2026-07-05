import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { FOOD_CATEGORIES } from "@/lib/utils";
import { FoodCategory } from "@/app/generated/prisma/enums";

const CATEGORY_VALUES = new Set(FOOD_CATEGORIES.map((c) => c.value));

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { ownerId: user.id }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "No store" }, { status: 403 });

  const body = await request.json();
  const { name, description, image, category, priceOriginal, priceSale, quantityTotal, pickupStart, pickupEnd, date } = body;

  if (!name || !image || !priceOriginal || !priceSale || !quantityTotal || !pickupStart || !pickupEnd || !date) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }
  if (!category || !CATEGORY_VALUES.has(category)) {
    return NextResponse.json({ error: "Loại đồ ăn không hợp lệ" }, { status: 400 });
  }

  const box = await prisma.box.create({
    data: {
      storeId:       store.id,
      name,
      description:   description || null,
      image:         image || null,
      category:      category as FoodCategory,
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
