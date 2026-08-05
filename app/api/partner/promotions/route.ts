import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DealType, PromotionKind } from "@/app/generated/prisma/enums";

const KINDS = new Set<string>(["PLATFORM_VOUCHER", "STORE_ANNOUNCEMENT"]);
const DEAL_TYPES = new Set<string>(["PERCENT_OFF", "FIXED_AMOUNT_OFF", "BOGO", "FREEBIE", "OTHER"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { ownerId: user.id }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "No store" }, { status: 403 });

  const body = await request.json();
  const { kind, title, description, image, dealType, discountValue, validFrom, validUntil, totalCodes } = body;

  if (!KINDS.has(kind)) return NextResponse.json({ error: "Loại chương trình không hợp lệ" }, { status: 400 });
  if (!title || !String(title).trim()) return NextResponse.json({ error: "Vui lòng nhập tên chương trình" }, { status: 400 });
  if (!validFrom || !validUntil) return NextResponse.json({ error: "Vui lòng nhập thời gian hiệu lực" }, { status: 400 });
  if (new Date(validUntil) <= new Date(validFrom)) {
    return NextResponse.json({ error: "Ngày kết thúc phải sau ngày bắt đầu" }, { status: 400 });
  }

  let resolvedDealType: DealType | null = null;
  let resolvedDiscountValue: number | null = null;
  if (dealType && DEAL_TYPES.has(dealType)) {
    resolvedDealType = dealType as DealType;
    if ((resolvedDealType === "PERCENT_OFF" || resolvedDealType === "FIXED_AMOUNT_OFF") && discountValue) {
      resolvedDiscountValue = Number(discountValue);
    }
  }

  const promotion = await prisma.promotion.create({
    data: {
      storeId:       store.id,
      kind:          kind as PromotionKind,
      title,
      description:   description || null,
      image:         image || null,
      dealType:      resolvedDealType,
      discountValue: resolvedDiscountValue,
      validFrom:     new Date(validFrom),
      validUntil:    new Date(validUntil),
      totalCodes:    kind === "PLATFORM_VOUCHER" && totalCodes ? Number(totalCodes) : null,
    },
  });

  return NextResponse.json({ ok: true, promotionId: promotion.id });
}
