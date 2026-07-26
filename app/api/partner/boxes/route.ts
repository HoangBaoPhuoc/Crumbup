import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { FOOD_CATEGORIES } from "@/lib/utils";
import { FoodCategory, ProductType } from "@/app/generated/prisma/enums";

const CATEGORY_VALUES = new Set(FOOD_CATEGORIES.map((c) => c.value));

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { ownerId: user.id }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "No store" }, { status: 403 });

  const body = await request.json();
  const { name, description, image, category, priceOriginal, priceSale, quantityTotal, pickupStart, pickupEnd, date } = body;
  const productType: ProductType = body.productType === "VOUCHER" ? "VOUCHER" : "SURPRISE_BOX";

  if (!name || !image || !priceOriginal || !priceSale || !quantityTotal || !pickupStart || !pickupEnd || !date) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }
  // Surprise Box giữ nguyên yêu cầu chọn ngành hàng; Voucher là ưu đãi cụ thể nên không bắt buộc.
  if (productType === "SURPRISE_BOX" && (!category || !CATEGORY_VALUES.has(category))) {
    return NextResponse.json({ error: "Ngành hàng không hợp lệ" }, { status: 400 });
  }
  const resolvedCategory: FoodCategory = category && CATEGORY_VALUES.has(category) ? (category as FoodCategory) : "KHAC";

  const box = await prisma.box.create({
    data: {
      storeId:       store.id,
      name,
      description:   description || null,
      image:         image || null,
      category:      resolvedCategory,
      productType,
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
