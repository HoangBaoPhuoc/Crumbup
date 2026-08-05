import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DealType } from "@/app/generated/prisma/enums";

const DEAL_TYPES = new Set<string>(["PERCENT_OFF", "FIXED_AMOUNT_OFF", "BOGO", "FREEBIE", "OTHER"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const promotion = await prisma.promotion.findUnique({
    where: { id },
    select: { id: true, kind: true, store: { select: { ownerId: true } } },
  });
  if (!promotion) return NextResponse.json({ error: "Không tìm thấy chương trình" }, { status: 404 });
  if (promotion.store.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  // Toggle-only request
  if (typeof body.active === "boolean" && Object.keys(body).length === 1) {
    await prisma.promotion.update({ where: { id }, data: { active: body.active } });
    return NextResponse.json({ ok: true });
  }

  const { title, description, image, dealType, discountValue, validFrom, validUntil, totalCodes } = body;

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

  await prisma.promotion.update({
    where: { id },
    data: {
      title,
      description:   description || null,
      image:         image || null,
      dealType:      resolvedDealType,
      discountValue: resolvedDiscountValue,
      validFrom:     new Date(validFrom),
      validUntil:    new Date(validUntil),
      totalCodes:    promotion.kind === "PLATFORM_VOUCHER" && totalCodes ? Number(totalCodes) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
