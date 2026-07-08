import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, discountPercent, formatVNDate } from "@/lib/utils";
import BoxCountdown from "./BoxCountdown";
import StoreMapClient from "./StoreMapClient";
import OrderButton from "./OrderButton";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "1 ngày trước";
  if (days < 7) return `${days} ngày trước`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 tuần trước" : `${weeks} tuần trước`;
}

export default async function BoxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const box = await prisma.box.findUnique({
    where: { id },
    include: {
      store: {
        include: {
          owner: { select: { email: true } },
          reviews: {
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
    },
  });

  if (!box) notFound();

  const nowVN   = new Date(Date.now() + 7 * 60 * 60_000);
  const nowHHMM = `${String(nowVN.getUTCHours()).padStart(2, "0")}:${String(nowVN.getUTCMinutes()).padStart(2, "0")}`;
  const isExpired = box.pickupEnd < nowHHMM;

  const recentOrdersCount = await prisma.orderItem.count({
    where: { boxId: box.id, order: { createdAt: { gte: new Date(Date.now() - 2 * 60 * 60_000) } } },
  });

  const { store } = box;
  const reviews = store.reviews;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const disc    = discountPercent(box.priceOriginal, box.priceSale);
  const savings = box.priceOriginal - box.priceSale;

  return (
    <>
      <SiteHeader />

      {/* Breadcrumb */}
      <div style={{ paddingTop: 89, paddingBottom: 16, background: "white", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
            <Link href="/discover" style={{ color: "var(--text-muted)" }}>Khám phá</Link>
            <span>›</span>
            <span>{store.name}</span>
            <span>›</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{box.name}</span>
          </div>
        </div>
      </div>

      <main style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="container box-detail-grid" style={{ gap: 40 }}>

          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Cover image */}
            <div style={{
              background: "linear-gradient(135deg, #fde6d4 0%, #f5d4b3 100%)",
              borderRadius: 24, overflow: "hidden",
              minHeight: 360, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ position: "absolute", top: 20, left: 20, zIndex: 1, display: "flex", gap: 8 }}>
                <span className="badge badge-primary" style={{ padding: "6px 14px", fontSize: 13 }}>−{disc}%</span>
                {box.quantityLeft <= 2 && (
                  <span className="badge badge-warm" style={{ padding: "6px 14px", fontSize: 13 }}>Sắp hết</span>
                )}
              </div>
              {box.image ? (
                <img src={box.image} alt={box.name}
                  style={{ width: "100%", height: "100%", minHeight: 360, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ fontSize: 120, lineHeight: 1, padding: "60px 0" }}>🥐</div>
              )}
            </div>

            {/* Title block — badges, name, store, social proof, intro */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="badge badge-primary">−{disc}%</span>
                {avgRating && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>⭐ {avgRating} · {reviews.length} đánh giá</span>
                )}
                {store.verified && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#2d6a31" }}>✓ Đối tác xác thực</span>
                )}
              </div>

              <h1 style={{ fontSize: 26, margin: 0, lineHeight: 1.2 }}>{box.name}</h1>

              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
                <span>{store.name} · {store.address}</span>
                {store.phone && <span>📞 {store.phone}</span>}
              </div>

              {recentOrdersCount > 0 && (
                <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8, background: "var(--accent-soft)", color: "#2d6a31", fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 999 }}>
                  🔥 {recentOrdersCount} người đã đặt trong 2 giờ qua
                </div>
              )}

              {(box.description || store.description) && (
                <div style={{ background: "white", borderRadius: 18, border: "1px solid var(--border)", padding: 24 }}>
                  <h3 style={{ fontSize: 15, marginBottom: 10, fontWeight: 700 }}>Giới thiệu Box</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
                    {box.description ?? store.description}
                  </p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ fontSize: 18, flex: 1, fontWeight: 700 }}>Đánh giá từ khách hàng</h3>
                {avgRating && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
                    ⭐ {avgRating} / 5 · {reviews.length} đánh giá
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                  <p style={{ fontSize: 14 }}>Chưa có đánh giá nào cho tiệm này</p>
                </div>
              ) : (
                reviews.map((r, i) => (
                  <div key={r.id} style={{ padding: "16px 0", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-soft)", display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{r.user.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(r.createdAt)}</div>
                      </div>
                      <div style={{ fontSize: 13, flexShrink: 0 }}>{"⭐".repeat(r.rating)}</div>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, paddingLeft: 48 }}>{r.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT — purchase panel ── */}
          <aside style={{ position: "sticky", top: 97, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "white", borderRadius: 24, border: "1px solid var(--border)", padding: 28, boxShadow: "var(--shadow-md)" }}>
              {box.quantityLeft <= 2 && !isExpired && (
                <div style={{
                  background: "var(--danger)", color: "white", borderRadius: 10,
                  padding: "8px 14px", fontSize: 13, fontWeight: 700, marginBottom: 14,
                  textAlign: "center",
                }}>
                  ⚡ Chỉ còn {box.quantityLeft} box — đặt ngay kẻo hết!
                </div>
              )}

              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "line-through" }}>
                  {formatPrice(box.priceOriginal)}
                </span>
                <span style={{ fontSize: 34, fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-display)" }}>
                  {formatPrice(box.priceSale)}
                </span>
              </div>
              <span className="badge badge-success" style={{ marginBottom: 20 }}>
                Tiết kiệm {formatPrice(savings)} ({disc}%)
              </span>

              <div style={{ background: "var(--cream)", borderRadius: 14, padding: 16, marginTop: 4, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { ic: "🕒", lbl: "Giờ nhận",  val: `${box.pickupStart} – ${box.pickupEnd}` },
                  { ic: "📅", lbl: "Ngày",       val: formatVNDate(box.date) },
                  { ic: "📦", lbl: "Còn lại",   val: `${box.quantityLeft} box` },
                  { ic: "🏪", lbl: "Hình thức", val: "Nhận tại cửa hàng" },
                ].map((row) => (
                  <div key={row.lbl} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{row.ic}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0, minWidth: 60 }}>{row.lbl}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, textAlign: "right", flex: 1 }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <BoxCountdown pickupStart={box.pickupStart} pickupEnd={box.pickupEnd} />
              </div>

              <OrderButton
                box={{ id: box.id, name: box.name, priceSale: box.priceSale, pickupStart: box.pickupStart, pickupEnd: box.pickupEnd, quantityLeft: box.quantityLeft }}
                store={{ name: store.name, phone: store.phone ?? null, address: store.address, email: store.owner.email ?? null }}
                isLoggedIn={isLoggedIn}
                isExpired={isExpired}
              />
            </div>

            <div style={{ background: "var(--cream)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>♻️</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>Mỗi đơn cứu ~2 kg thực phẩm khỏi thùng rác</span>
            </div>

            {/* Map */}
            {store.lat && store.lng && (
              <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ height: 200 }}>
                  <StoreMapClient lat={store.lat} lng={store.lng} name={store.name} />
                </div>
                <a
                  href={`https://www.google.com/maps?q=${store.lat},${store.lng}(${encodeURIComponent(store.name)})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-address-link"
                  style={{
                    padding: "10px 16px", fontSize: 12, color: "var(--primary)",
                    borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6,
                    textDecoration: "underline", textUnderlineOffset: 2,
                  }}
                  title="Xem trên Google Maps"
                >
                  <span>📍</span>
                  <span style={{ flex: 1 }}>{store.address}</span>
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>↗</span>
                </a>
              </div>
            )}
          </aside>

        </div>
      </main>

      <SiteFooter />
    </>
  );
}
