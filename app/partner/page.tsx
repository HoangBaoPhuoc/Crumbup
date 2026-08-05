import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CreateBoxModal from "./CreateBoxModal";
import PartnerLogoutButton from "./PartnerLogoutButton";
import PartnerTables from "./PartnerTables";
import BoxHistoryTab from "./BoxHistoryTab";
import OrderHistoryTab from "./OrderHistoryTab";
import StoreSettingsForm from "./StoreSettingsForm";
import PromotionsTab from "./PromotionsTab";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PICKED_UP: "Đã nhận hàng",
  CANCELLED: "Đã hủy",
};
const STATUS_COLOR: Record<string, React.CSSProperties> = {
  PENDING:   { background: "#fef3c7", color: "#92400e" },
  CONFIRMED: { background: "#dbeafe", color: "#1e40af" },
  PICKED_UP: { background: "#dcfce7", color: "#15803d" },
  CANCELLED: { background: "#f1f5f9", color: "#64748b" },
};

function fmtVN(date: Date | string) {
  const d = new Date(new Date(date).getTime() + 7 * 60 * 60_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "13px 20px", fontSize: 15, color: "var(--text)" };

export default async function PartnerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "overview" } = await searchParams;

  /* ── Auth ── */
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const prismaUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, name: true, role: true },
  });
  if (!prismaUser || prismaUser.role !== "BUSINESS") redirect("/");

  /* ── Store ── */
  const store = await prisma.store.findFirst({
    where: { ownerId: prismaUser.id },
    select: { id: true, name: true, address: true, phone: true, description: true, verified: true, openHours: true, industry: true },
  });

  if (!store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ivory)" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Chưa có cửa hàng</div>
          <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 20 }}>Tài khoản của bạn chưa liên kết với cửa hàng nào. Vui lòng liên hệ hỗ trợ.</p>
          <Link href="/" className="btn btn-primary">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  /* ── Data ── */
  const nowVN   = new Date(Date.now() + 7 * 60 * 60_000);
  const nowHHMM = `${String(nowVN.getUTCHours()).padStart(2, "0")}:${String(nowVN.getUTCMinutes()).padStart(2, "0")}`;
  // UTC midnight of VN date — used for box date comparisons (date field stored as UTC midnight)
  const todayVN  = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));
  const tomorrow = new Date(todayVN.getTime() + 24 * 60 * 60_000);
  // VN midnight in UTC — used for order createdAt comparisons (full datetime)
  const vnDayStart = new Date(todayVN.getTime() - 7 * 60 * 60_000);
  const vnDayEnd   = new Date(tomorrow.getTime() - 7 * 60 * 60_000);

  const [todayBoxes, futureBoxes, pastBoxes, pendingConfirmedOrders, reviews, allOrdersCount, pendingCount, todayRevenueAgg, completedOrders, categoryOptions, promotions] = await Promise.all([
    prisma.box.findMany({
      where: { storeId: store.id, date: { gte: todayVN, lt: tomorrow } },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.box.findMany({
      where: { storeId: store.id, date: { gte: tomorrow } },
      orderBy: { date: "asc" },
      include: { category: true },
    }),
    prisma.box.findMany({
      where: { storeId: store.id, date: { lt: todayVN } },
      orderBy: { date: "desc" },
      take: 30,
      include: { category: true },
    }),
    prisma.order.findMany({
      where: { storeId: store.id, status: { in: ["PENDING", "CONFIRMED"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, total: true, status: true, pickupCode: true, createdAt: true, pickedUpAt: true,
        user: { select: { name: true } },
        items: { take: 1, select: { quantity: true, box: { select: { name: true, date: true, pickupEnd: true } } } },
      },
    }),
    prisma.review.findMany({ where: { storeId: store.id }, select: { rating: true } }),
    prisma.order.count({ where: { storeId: store.id } }),
    prisma.order.count({ where: { storeId: store.id, status: "PENDING" } }),
    prisma.order.aggregate({
      where: {
        storeId: store.id,
        status: { in: ["CONFIRMED", "PICKED_UP"] },
        createdAt: { gte: vnDayStart, lt: vnDayEnd },
      },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { storeId: store.id, status: { in: ["PICKED_UP", "CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, total: true, status: true, pickupCode: true, createdAt: true, pickedUpAt: true,
        user: { select: { name: true } },
        items: { take: 1, select: { quantity: true, box: { select: { name: true, date: true, pickupEnd: true } } } },
      },
    }),
    prisma.productCategory.findMany({
      where: { active: true, OR: [{ industry: store.industry }, { industry: null }] },
      orderBy: { sortOrder: "asc" },
      select: { id: true, key: true, label: true, emoji: true, industry: true },
    }),
    prisma.promotion.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      include: { claims: { select: { status: true } } },
    }),
  ]);

  /* ── Split today boxes by expiry ── */
  const activeTodayBoxes  = todayBoxes.filter((b) => b.pickupEnd >= nowHHMM);
  const expiredTodayBoxes = todayBoxes.filter((b) => b.pickupEnd < nowHHMM);
  const historyBoxes      = [...expiredTodayBoxes, ...pastBoxes];

  /* ── Split pending/confirmed orders by pickup expiry ── */
  const todayStr = nowVN.toISOString().slice(0, 10);
  function isOrderExpired(o: typeof pendingConfirmedOrders[number]) {
    const box = o.items[0]?.box;
    if (!box) return false;
    const boxDate = new Date(new Date(box.date).getTime() + 7 * 60 * 60_000).toISOString().slice(0, 10);
    return boxDate < todayStr || (boxDate === todayStr && box.pickupEnd < nowHHMM);
  }
  const activeOrders  = pendingConfirmedOrders.filter((o) => !isOrderExpired(o));
  const expiredOrders = pendingConfirmedOrders.filter(isOrderExpired);

  const orderHistory = [...expiredOrders, ...completedOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  /* ── Stats ── */
  const sellingBoxes = activeTodayBoxes
    .filter((b) => b.active && b.quantityLeft > 0)
    .reduce((sum, b) => sum + b.quantityLeft, 0);
  const todayRevenue = todayRevenueAgg._sum.total ?? 0;
  const avgRating      = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const displayDate = todayVN.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

  const navItems = [
    { label: "Tổng quan",          href: "/partner",                    key: "overview"      },
    { label: "Lịch sử box",        href: "/partner?tab=box-history",    key: "box-history"   },
    { label: "Lịch sử đơn hàng",   href: "/partner?tab=order-history",  key: "order-history" },
    { label: "Chương trình khuyến mãi", href: "/partner?tab=promotions", key: "promotions"    },
    { label: "Cài đặt cửa hàng",   href: "/partner?tab=settings",       key: "settings"      },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--ivory)", fontFamily: "var(--font-body)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, background: "white", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", padding: "24px 12px",
        position: "sticky", top: 0, height: "100vh", flexShrink: 0,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 28, paddingLeft: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--primary)", display: "grid", placeItems: "center" }}>
            <div style={{ width: 28, height: 28, backgroundImage: "url('/crumbup-logo-nocap.jpg')", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>CrumbUp</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cửa hàng</div>
          </div>
        </Link>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const isActive = item.key === tab || (item.key === "overview" && tab === "overview");
            return (
              <a
                key={item.key}
                href={item.href}
                style={{
                  display: "block", padding: "9px 12px", borderRadius: 10,
                  fontSize: 16, fontWeight: 600, color: isActive ? "var(--primary)" : "var(--text)",
                  textDecoration: "none",
                  background: isActive ? "var(--primary-soft)" : "transparent",
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, paddingLeft: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 2 }}>{prismaUser.name}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Chủ cửa hàng</div>
          <PartnerLogoutButton />
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "28px 36px 48px", maxWidth: "calc(100vw - 220px)" }}>

        {tab === "overview" && (
          <>
            {/* Header */}
            <div id="overview" style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h1 style={{ fontSize: 25, fontWeight: 900, color: "var(--text)" }}>{store.name}</h1>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: store.verified ? "#dcfce7" : "#fef3c7",
                      color: store.verified ? "#15803d" : "#92400e",
                    }}>
                      {store.verified ? "Đã xác nhận" : "Chờ xét duyệt"}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, color: "var(--text-muted)" }}>{displayDate}</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <CreateBoxModal storeAddress={store.address} categories={categoryOptions} />
                </div>
              </div>

              {!store.verified && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12, fontSize: 15, color: "#92400e" }}>
                  Cửa hàng đang chờ admin xét duyệt. Box sẽ hiển thị công khai sau khi được duyệt.
                </div>
              )}
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Box đang bán",     value: sellingBoxes,                               sub: `${activeTodayBoxes.length} loại hôm nay` },
                { label: "Chờ xác nhận",     value: pendingCount,                               sub: `${allOrdersCount} đơn tổng cộng`, alert: pendingCount > 0 },
                { label: "Doanh thu hôm nay", value: todayRevenue.toLocaleString("vi-VN") + "đ", sub: "Sau 15% phí nền tảng: " + Math.round(todayRevenue * 0.85).toLocaleString("vi-VN") + "đ" },
                { label: "Đánh giá TB",      value: avgRating ? `${avgRating} ★` : "—",         sub: `${reviews.length} đánh giá` },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "white", borderRadius: 14, padding: "18px 20px",
                  border: (s as { alert?: boolean }).alert ? "2px solid var(--primary)" : "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: (s as { alert?: boolean }).alert ? "var(--primary)" : "var(--text)", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <PartnerTables
              activeBoxes={activeTodayBoxes}
              futureBoxes={futureBoxes}
              recentOrders={activeOrders}
              totalOrders={activeOrders.length}
              storeAddress={store.address}
              categories={categoryOptions}
            />
          </>
        )}

        {tab === "box-history" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 25, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>Lịch sử box</h1>
              <p style={{ fontSize: 15, color: "var(--text-muted)" }}>Các box đã hết giờ và từ ngày trước</p>
            </div>
            <BoxHistoryTab historyBoxes={historyBoxes} storeAddress={store.address} categories={categoryOptions} />
          </>
        )}

        {tab === "order-history" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 25, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>Lịch sử đơn hàng</h1>
              <p style={{ fontSize: 15, color: "var(--text-muted)" }}>Đơn đã hoàn thành, hủy, hoặc hết giờ nhận</p>
            </div>
            <OrderHistoryTab orders={orderHistory} />
          </>
        )}

        {tab === "promotions" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 25, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>Chương trình khuyến mãi</h1>
              <p style={{ fontSize: 15, color: "var(--text-muted)" }}>Quản lý mã khuyến mãi nền tảng và quảng cáo chương trình tại cửa hàng</p>
            </div>
            <PromotionsTab promotions={promotions} />
          </>
        )}

        {tab === "settings" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 25, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>Cài đặt cửa hàng</h1>
              <p style={{ fontSize: 15, color: "var(--text-muted)" }}>Cập nhật thông tin và ngành hàng của cửa hàng</p>
            </div>
            <StoreSettingsForm store={{
              name: store.name,
              address: store.address,
              phone: store.phone,
              openHours: store.openHours,
              description: store.description,
              industry: store.industry,
            }} />
          </>
        )}

      </main>
    </div>
  );
}
