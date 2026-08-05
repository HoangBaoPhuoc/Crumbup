import { redirect } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import OrderCard from "./OrderCard";
import VoucherClaimCard from "./VoucherClaimCard";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [orders, voucherClaims] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true, address: true, phone: true, logo: true, owner: { select: { email: true } } } },
        items: {
          include: {
            box: { select: { name: true, pickupStart: true, pickupEnd: true, image: true, date: true } },
          },
        },
        review: { select: { id: true } },
      },
    }),
    prisma.voucherClaim.findMany({
      where: { userId: user.id },
      orderBy: { claimedAt: "desc" },
      include: { promotion: { include: { store: { select: { name: true, address: true } } } } },
    }),
  ]);

  const active    = orders.filter((o) => ["PENDING", "CONFIRMED"].includes(o.status));
  const completed = orders.filter((o) => ["PICKED_UP", "CANCELLED"].includes(o.status));

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: "100vh", background: "var(--ivory)", paddingTop: 80 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 64px" }}>

          {/* Back + title */}
          <div style={{ marginBottom: 28 }}>
            <Link href="/discover" style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 600, textDecoration: "none" }}>
              ← Khám phá Box
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", marginTop: 10, marginBottom: 0 }}>
              Đơn hàng của tôi
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 4 }}>
              {orders.length} đơn hàng
            </p>
          </div>

          {voucherClaims.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Ưu đãi đã lấy · {voucherClaims.length}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {voucherClaims.map((c) => <VoucherClaimCard key={c.id} claim={c} />)}
              </div>
            </section>
          )}

          {orders.length === 0 ? (
            <div style={{
              background: "white", borderRadius: 20, border: "1px solid var(--border)",
              padding: "64px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 46, marginBottom: 16 }}>🛍️</div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Chưa có đơn hàng nào
              </p>
              <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 24 }}>
                Khám phá các ưu đãi hôm nay và đặt ngay!
              </p>
              <Link href="/discover" className="btn btn-primary">Khám phá Box</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {/* Active orders */}
              {active.length > 0 && (
                <section>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Đang xử lý · {active.length}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {active.map((o) => <OrderCard key={o.id} order={o} />)}
                  </div>
                </section>
              )}

              {/* Completed orders */}
              {completed.length > 0 && (
                <section>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Lịch sử · {completed.length}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {completed.map((o) => <OrderCard key={o.id} order={o} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export type OrderWithRelations = Awaited<ReturnType<typeof prisma.order.findMany>>[number] & {
  store: { id: string; name: string; address: string; phone: string | null; logo: string | null; owner: { email: string | null } };
  items: Array<{
    id: string; quantity: number; priceAtTime: number;
    box: { name: string; pickupStart: string; pickupEnd: string; image: string | null; date: Date };
  }>;
  review: { id: string } | null;
};

