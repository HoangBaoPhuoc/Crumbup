import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import ReviewForm from "./ReviewForm";

export default async function ReviewPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/review/${orderId}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      store: { select: { name: true, address: true } },
      items: { include: { box: { select: { name: true, image: true } } } },
      review: { select: { id: true } },
    },
  });

  if (!order || order.userId !== user.id) notFound();
  if (order.status !== "PICKED_UP") redirect("/orders");
  if (order.review) redirect("/orders");

  const firstBox = order.items[0]?.box;

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: "100vh", background: "var(--ivory)", paddingTop: 80 }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 64px" }}>
          <Link href="/orders" style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 600, textDecoration: "none" }}>
            ← Đơn hàng của tôi
          </Link>

          <div style={{
            background: "white", borderRadius: 20, border: "1px solid var(--border)",
            padding: 28, marginTop: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0,
                background: "var(--cream)", display: "grid", placeItems: "center", fontSize: 28,
              }}>
                {firstBox?.image
                  ? <img src={firstBox.image} alt={firstBox.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : "🥐"}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{order.store.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{firstBox?.name}</div>
              </div>
            </div>

            <ReviewForm orderId={order.id} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
