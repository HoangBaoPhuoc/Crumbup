import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CreateBoxModal from "./CreateBoxModal";
import RevenueDatePicker from "./RevenueDatePicker";
import LiveClock from "./LiveClock";
import RefreshButton from "./RefreshButton";
import Sidebar from "./Sidebar";
import PartnerTables from "./PartnerTables";
import BoxHistoryTab from "./BoxHistoryTab";
import OrderHistoryTab from "./OrderHistoryTab";
import MessagesTab from "./MessagesTab";
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
  PICKED_UP: { background: "#e0f2fe", color: "#0369a1" },
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
  searchParams: Promise<{ tab?: string; revenueDate?: string }>;
}) {
  const { tab = "overview", revenueDate } = await searchParams;

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
  // Revenue card date selection — defaults to today, clamped to not go past today.
  const todayStr = todayVN.toISOString().slice(0, 10);
  const isValidDateStr = !!revenueDate && /^\d{4}-\d{2}-\d{2}$/.test(revenueDate);
  const selectedDateStr = isValidDateStr && revenueDate! <= todayStr ? revenueDate! : todayStr;
  const [selY, selM, selD] = selectedDateStr.split("-").map(Number);
  const selectedDayVN    = new Date(Date.UTC(selY, selM - 1, selD));
  const revenueDayStart  = new Date(selectedDayVN.getTime() - 7 * 60 * 60_000);
  const revenueDayEnd    = new Date(revenueDayStart.getTime() + 24 * 60 * 60_000);

  const [todayBoxes, futureBoxes, pastBoxes, pendingConfirmedOrders, reviews, allOrdersCount, revenueAgg, completedOrders, categoryOptions, promotions] = await Promise.all([
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
        user: { select: { id: true, name: true } },
        items: { take: 1, select: { quantity: true, box: { select: { name: true, date: true, pickupEnd: true } } } },
      },
    }),
    prisma.review.findMany({ where: { storeId: store.id }, select: { rating: true } }),
    prisma.order.count({ where: { storeId: store.id } }),
    prisma.order.aggregate({
      where: {
        storeId: store.id,
        status: { in: ["CONFIRMED", "PICKED_UP"] },
        createdAt: { gte: revenueDayStart, lt: revenueDayEnd },
      },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { storeId: store.id, status: { in: ["PICKED_UP", "CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, total: true, status: true, pickupCode: true, createdAt: true, pickedUpAt: true,
        user: { select: { id: true, name: true } },
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
      include: {
        claims: {
          select: {
            code: true, status: true, claimedAt: true, redeemedAt: true,
            user: { select: { name: true, phone: true } },
          },
          orderBy: { claimedAt: "desc" },
        },
      },
    }),
  ]);

  /* ── Split today boxes by expiry ── */
  const activeTodayBoxes  = todayBoxes.filter((b) => b.pickupEnd >= nowHHMM);
  const expiredTodayBoxes = todayBoxes.filter((b) => b.pickupEnd < nowHHMM);
  const historyBoxes      = [...expiredTodayBoxes, ...pastBoxes];

  /* ── Split pending/confirmed orders by pickup expiry ── */
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
  const pendingCount = activeOrders.filter((o) => o.status === "PENDING").length;
  const revenue = revenueAgg._sum.total ?? 0;
  const isRevenueToday = selectedDateStr === todayStr;
  const revenueDateLabel = new Date(selectedDayVN.getTime()).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const avgRating      = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const navItems = [
    { label: "Tổng quan",          href: "/partner",                    key: "overview"      },
    { label: "Lịch sử box",        href: "/partner?tab=box-history",    key: "box-history"   },
    { label: "Lịch sử đơn hàng",   href: "/partner?tab=order-history",  key: "order-history" },
    { label: "Tin nhắn",           href: "/partner?tab=messages",       key: "messages"      },
    { label: "Chương trình khuyến mãi", href: "/partner?tab=promotions", key: "promotions"    },
    { label: "Cài đặt cửa hàng",   href: "/partner?tab=settings",       key: "settings"      },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--ivory)", fontFamily: "var(--font-body)" }}>

      <Sidebar navItems={navItems} activeTab={tab} userName={prismaUser.name} />

      {/* ── Main ── */}
      <main style={{ flex: 1, minWidth: 0, padding: "28px 36px 48px" }}>

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
                      background: store.verified ? "#e0f2fe" : "#fef3c7",
                      color: store.verified ? "#0369a1" : "#92400e",
                    }}>
                      {store.verified ? "Đã xác nhận" : "Chờ xét duyệt"}
                    </span>
                  </div>
                  <LiveClock />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <RefreshButton />
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
                {
                  id: "boxes", label: "Box đang bán", value: sellingBoxes,
                  sub: `${activeTodayBoxes.length} loại hôm nay`,
                },
                {
                  id: "pending", label: "Chờ xác nhận", value: pendingCount,
                  alert: pendingCount > 0,
                },
                {
                  id: "revenue",
                  label: isRevenueToday ? "Doanh thu hôm nay" : `Doanh thu ${revenueDateLabel}`,
                  value: revenue.toLocaleString("vi-VN") + "đ",
                  sub: "Sau 15% phí nền tảng: " + Math.round(revenue * 0.85).toLocaleString("vi-VN") + "đ",
                  control: <RevenueDatePicker value={selectedDateStr} max={todayStr} />,
                },
                {
                  id: "rating", label: "Đánh giá TB", value: avgRating ? `${avgRating} / 5` : "—",
                  sub: `${reviews.length} đánh giá`,
                },
              ].map((s) => (
                <div key={s.id} style={{
                  background: "white", borderRadius: 14, padding: "18px 20px",
                  border: (s as { alert?: boolean }).alert ? "2px solid var(--primary)" : "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                    {(s as { control?: React.ReactNode }).control}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: (s as { alert?: boolean }).alert ? "var(--primary)" : "var(--text)", lineHeight: 1 }}>{s.value}</div>
                  {"sub" in s && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            <PartnerTables
              activeBoxes={activeTodayBoxes}
              futureBoxes={futureBoxes}
              recentOrders={activeOrders}
              totalOrders={allOrdersCount}
              hasBoxHistory={historyBoxes.length > 0}
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

        {tab === "messages" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 25, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>Tin nhắn</h1>
              <p style={{ fontSize: 15, color: "var(--text-muted)" }}>Trao đổi với khách hàng</p>
            </div>
            <MessagesTab />
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

