import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Excludes visually ambiguous characters (0/O, 1/I/L).
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để lấy mã" }, { status: 401 });

  const { id } = await params;
  const promotion = await prisma.promotion.findUnique({ where: { id } });
  if (!promotion || !promotion.active) {
    return NextResponse.json({ error: "Không tìm thấy chương trình" }, { status: 404 });
  }
  if (promotion.kind !== "PLATFORM_VOUCHER") {
    return NextResponse.json({ error: "Chương trình này không có mã để lấy" }, { status: 400 });
  }
  const now = new Date();
  if (now < promotion.validFrom || now > promotion.validUntil) {
    return NextResponse.json({ error: "Chương trình không còn trong thời gian áp dụng" }, { status: 400 });
  }
  const existing = await prisma.voucherClaim.findUnique({
    where: { promotionId_userId: { promotionId: id, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Bạn đã lấy mã cho chương trình này rồi", code: existing.code }, { status: 409 });
  }

  if (promotion.totalCodes != null && promotion.claimedCount >= promotion.totalCodes) {
    return NextResponse.json({ error: "Đã hết mã cho chương trình này" }, { status: 409 });
  }

  try {
    const claim = await prisma.$transaction(async (tx) => {
      const fresh = await tx.promotion.findUnique({ where: { id } });
      if (!fresh || (fresh.totalCodes != null && fresh.claimedCount >= fresh.totalCodes)) {
        throw new Error("SOLD_OUT");
      }

      let code = generateCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const clash = await tx.voucherClaim.findUnique({ where: { code } });
        if (!clash) break;
        code = generateCode();
      }

      const created = await tx.voucherClaim.create({
        data: { promotionId: id, userId: user.id, code },
      });
      await tx.promotion.update({ where: { id }, data: { claimedCount: { increment: 1 } } });
      return created;
    });

    return NextResponse.json({ ok: true, code: claim.code });
  } catch (err) {
    if (err instanceof Error && err.message === "SOLD_OUT") {
      return NextResponse.json({ error: "Đã hết mã cho chương trình này" }, { status: 409 });
    }
    return NextResponse.json({ error: "Lỗi lấy mã. Vui lòng thử lại." }, { status: 500 });
  }
}
