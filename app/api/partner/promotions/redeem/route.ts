import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { ownerId: user.id }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "No store" }, { status: 403 });

  const { code } = await request.json();
  if (!code || !String(code).trim()) {
    return NextResponse.json({ error: "Vui lòng nhập mã" }, { status: 400 });
  }

  const claim = await prisma.voucherClaim.findUnique({
    where: { code: String(code).trim().toUpperCase() },
    include: { promotion: { select: { id: true, title: true, storeId: true, validUntil: true } }, user: { select: { name: true } } },
  });

  if (!claim || claim.promotion.storeId !== store.id) {
    return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 404 });
  }
  if (claim.status === "REDEEMED") {
    return NextResponse.json({ error: "Mã này đã được sử dụng trước đó" }, { status: 409 });
  }
  if (claim.status === "EXPIRED" || new Date() > claim.promotion.validUntil) {
    return NextResponse.json({ error: "Mã này đã hết hạn" }, { status: 409 });
  }

  const updated = await prisma.voucherClaim.update({
    where: { id: claim.id },
    data: { status: "REDEEMED", redeemedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    promotionTitle: claim.promotion.title,
    customerName: claim.user.name,
    redeemedAt: updated.redeemedAt,
  });
}
