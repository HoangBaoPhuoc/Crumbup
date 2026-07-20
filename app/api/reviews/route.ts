import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, rating, comment } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Đánh giá phải từ 1 đến 5 sao" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, storeId: true, status: true, review: { select: { id: true } } },
  });
  if (!order || order.userId !== user.id) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  if (order.status !== "PICKED_UP") return NextResponse.json({ error: "Chỉ có thể đánh giá sau khi đã nhận hàng" }, { status: 409 });
  if (order.review) return NextResponse.json({ error: "Đơn hàng này đã được đánh giá" }, { status: 409 });

  const commentText = typeof comment === "string" ? comment.trim().slice(0, 1000) : null;

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      storeId: order.storeId,
      orderId: order.id,
      rating,
      comment: commentText || null,
    },
  });

  return NextResponse.json({ reviewId: review.id });
}
