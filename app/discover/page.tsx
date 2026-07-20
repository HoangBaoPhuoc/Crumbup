import { Suspense } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { FoodCategory } from "@/app/generated/prisma/enums";
import { formatPrice, discountPercent, getVietnamToday, formatVNDate, categoryEmoji, categoryLabel, FOOD_CATEGORIES } from "@/lib/utils";
import MapView from "@/components/MapView";
import type { StorePin } from "@/components/MapView";
import PickupCountdown from "./PickupCountdown";
import FilterSidebar from "./FilterSidebar";
import SortButtons from "./SortButtons";
import ClearSearchButton from "./ClearSearchButton";
import DiscoverTabs from "./DiscoverTabs";
import { DiscoverNavProvider } from "./DiscoverNavContext";
import DiscoverLoadingOverlay from "./DiscoverLoadingOverlay";

const CATEGORY_VALUES = new Set(FOOD_CATEGORIES.map((c) => c.value));

async function getStorePins(): Promise<StorePin[]> {
  const { from, to } = getVietnamToday();
  const nowHHMM = vnTimeHHMM(0);
  const stores = await prisma.store.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    select: {
      id: true, name: true, lat: true, lng: true,
      boxes: {
        where: { active: true, quantityLeft: { gt: 0 }, date: { gte: from, lt: to }, pickupEnd: { gte: nowHHMM } },
        select: { id: true },
      },
    },
  });
  return stores
    .filter((s) => s.lat !== null && s.lng !== null)
    .map((s) => ({ id: s.id, name: s.name, lat: s.lat!, lng: s.lng!, boxCount: s.boxes.length }));
}

function vnTimeHHMM(offsetMinutes = 0): string {
  const now = new Date(Date.now() + (7 * 60 + offsetMinutes) * 60_000);
  return `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
}

const PRICE_RANGES: Record<string, { gte?: number; lt?: number; lte?: number }> = {
  low:  { lt: 50_000 },
  mid:  { gte: 50_000, lt: 100_000 },
  high: { gte: 100_000, lte: 150_000 },
};

// How many days of past (expired) boxes to still show, dimmed and unclickable, below today's boxes.
const PAST_DAYS_SHOWN = 100;

async function getBoxes(sort: string, prices: string[], pickups: string[], categories: string[], q: string) {
  const { from, to } = getVietnamToday();
  const windowStart = new Date(from.getTime() - PAST_DAYS_SHOWN * 24 * 60 * 60 * 1000);

  const priceOR = prices
    .filter((p) => PRICE_RANGES[p])
    .map((p) => ({ priceSale: PRICE_RANGES[p] }));

  const categoryValues = categories.filter((c): c is FoodCategory => CATEGORY_VALUES.has(c as FoodCategory));

  const hasSoon      = pickups.includes("soon");
  const nowHHMM      = vnTimeHHMM(0);
  const twoHoursHHMM = hasSoon ? vnTimeHHMM(120) : "";

  return prisma.box.findMany({
    where: {
      active: true,
      date: { gte: windowStart, lt: to },
      ...(categoryValues.length > 0 && { category: { in: categoryValues } }),
      AND: [
        // Today's boxes must still have stock; past days show regardless (they're expired either way).
        { OR: [{ date: { gte: from }, quantityLeft: { gt: 0 } }, { date: { lt: from } }] },
        ...(q.trim().length >= 1 ? [{
          OR: [
            { name:  { contains: q.trim(), mode: "insensitive" as const } },
            { store: { name: { contains: q.trim(), mode: "insensitive" as const } } },
          ],
        }] : []),
        ...(priceOR.length > 0 ? [{ OR: priceOR }] : []),
        ...(hasSoon ? [{ pickupEnd: { gte: nowHHMM }, pickupStart: { lte: twoHoursHHMM } }] : []),
      ],
    },
    include: { store: true },
    orderBy: [
      { date: "desc" },
      sort === "price_asc"  ? { priceSale: "asc" } :
      sort === "price_desc" ? { priceSale: "desc" } :
      { quantityLeft: "asc" },
    ],
  });
}

// Rough estimate — no per-box weight data yet, so we use an average CO2e figure per rescued box.
const CO2_KG_PER_BOX = 0.5;

async function getUserImpact(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId, status: "PICKED_UP" },
    include: { items: { include: { box: true } } },
  });

  let boxCount = 0;
  let moneySaved = 0;
  for (const order of orders) {
    for (const item of order.items) {
      boxCount += item.quantity;
      moneySaved += (item.box.priceOriginal - item.priceAtTime) * item.quantity;
    }
  }

  return {
    orderCount: orders.length,
    boxCount,
    moneySaved,
    carbonSavedKg: boxCount * CO2_KG_PER_BOX,
  };
}

function BoxSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          display: "grid",
          gridTemplateColumns: "128px 1fr auto",
          gap: 24,
          alignItems: "center",
          padding: "22px 0",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ width: 128, height: 96, borderRadius: 8, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 12, width: "25%", borderRadius: 4, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 18, width: "55%", borderRadius: 4, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 12, width: "40%", borderRadius: 4, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ height: 22, width: 80, borderRadius: 4, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 12, width: 60, borderRadius: 4, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

async function BoxList({ sort, prices, pickups, categories, q }: { sort: string; prices: string[]; pickups: string[]; categories: string[]; q: string }) {
  const boxes = await getBoxes(sort, prices, pickups, categories, q);
  const nowHHMM = vnTimeHHMM(0);
  const { from: todayStart } = getVietnamToday();

  if (boxes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 16, fontWeight: 600 }}>Hôm nay chưa có box nào</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Quay lại sau nhé!</p>
      </div>
    );
  }

  const hasLiveBox = boxes.some((b) => b.date.getTime() >= todayStart.getTime() && b.pickupEnd >= nowHHMM);

  return (
    <>
      {!hasLiveBox && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 600 }}>Hôm nay chưa có box nào</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Quay lại sau nhé! Dưới đây là các box đã hết hạn gần đây.</p>
        </div>
      )}
      {boxes.map((box, i) => {
        const disc      = discountPercent(box.priceOriginal, box.priceSale);
        const emoji     = categoryEmoji(box.category);
        const isLow     = box.quantityLeft <= 2;
        const isPastDay = box.date.getTime() < todayStart.getTime();
        const isExpired = isPastDay || box.pickupEnd < nowHHMM;
        const tone      = i % 2 === 0 ? "warm" : "cream";

        const card = (
          <div
            className={isExpired ? undefined : "box-row-hover"}
            style={{
              display: "grid",
              gridTemplateColumns: "128px 1fr auto",
              gap: 24,
              alignItems: "center",
              padding: "22px 16px",
              margin: "0 -16px",
              borderRadius: 12,
              borderBottom: "1px solid var(--border)",
              opacity: isExpired ? 0.55 : 1,
              filter: isExpired ? "grayscale(0.85)" : "none",
            }}>
            {/* Thumbnail */}
            <div style={{
              width: 128, height: 96, borderRadius: 8, overflow: "hidden",
              background: "var(--cream)", display: "grid", placeItems: "center",
              flexShrink: 0,
            }}>
              {box.image
                ? <img src={box.image} alt={box.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6, boxSizing: "border-box" }} />
                : <span style={{ fontSize: 42 }}>{emoji}</span>}
            </div>

            {/* Info */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5,
              }}>
                {box.store.name} · {box.store.address.split(",")[0]}
              </div>
              <h3 style={{ fontSize: 17, margin: "0 0 7px", color: "var(--text)", fontWeight: 700 }}>
                {box.name}
              </h3>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {isExpired
                  ? <span style={{ color: "#9ca3af" }}>{isPastDay ? `Đã hết hạn · ${formatVNDate(box.date)}` : "Đã hết giờ nhận"}</span>
                  : <>Nhận {box.pickupStart} – {box.pickupEnd} · còn {box.quantityLeft} box</>
                }
              </div>
            </div>

            {/* Price & action */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, paddingLeft: 24 }}>
              {isExpired ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>{isPastDay ? "Đã hết hạn" : "Đã hết giờ"}</span>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>
                      {formatPrice(box.priceSale)}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "line-through" }}>
                      {formatPrice(box.priceOriginal)}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
                    Giảm {disc}%
                  </span>
                </>
              )}
            </div>
          </div>
        );

        if (isExpired) {
          return (
            <div key={box.id} style={{ textDecoration: "none", color: "inherit", cursor: "not-allowed" }}>
              {card}
            </div>
          );
        }

        return (
          <Link key={box.id} href={`/box/${box.id}`} className="box-card-row" style={{ textDecoration: "none", color: "inherit" }}>
            {card}
          </Link>
        );
      })}
    </>
  );
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; price?: string | string[]; pickup?: string | string[]; category?: string | string[]; q?: string }>;
}) {
  const sp         = await searchParams;
  const sort       = sp.sort ?? "default";
  const prices     = sp.price    ? (Array.isArray(sp.price)    ? sp.price    : [sp.price])    : [];
  const pickups    = sp.pickup   ? (Array.isArray(sp.pickup)   ? sp.pickup   : [sp.pickup])   : [];
  const categories = sp.category ? (Array.isArray(sp.category) ? sp.category : [sp.category]) : [];
  const q          = sp.q ?? "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [storePins, totalBoxes, impact] = await Promise.all([
    getStorePins(),
    prisma.box.count({
      where: {
        active: true,
        quantityLeft: { gt: 0 },
        date: (() => { const { from, to } = getVietnamToday(); return { gte: from, lt: to }; })(),
        pickupEnd: { gte: vnTimeHHMM(0) },
      },
    }),
    user ? getUserImpact(user.id) : Promise.resolve(null),
  ]);

  return (
    <>
      <SiteHeader />

      {/* Tab bar */}
      <div
        className="rise rise-1 discover-tabs"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
          paddingTop: 73,
          position: "sticky",
          top: 0,
          zIndex: 90,
        }}
      >
        <DiscoverTabs />
      </div>

      <main className="discover-main">
        <DiscoverNavProvider>
        <div className="discover-layout" style={{ gap: 48 }}>
          {/* Filters sidebar — plain text, no card box */}
          <div>
            <Suspense fallback={<div style={{ width: 200, height: 200 }} />}>
              <FilterSidebar />
            </Suspense>
          </div>

          {/* Results — editorial list */}
          <div className="rise rise-4">
            {/* List header with hairline */}
            <div style={{
              display: "flex", alignItems: "baseline", gap: 12,
              borderBottom: "2px solid var(--text)", paddingBottom: 14, marginBottom: 12,
            }}>
              <h2 style={{ fontSize: 26, margin: 0, color: "var(--text)", letterSpacing: "-0.02em" }}>
                Box hôm nay
              </h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {totalBoxes} box
                {q && <> · &ldquo;{q}&rdquo;</>}
              </span>
              {q && <ClearSearchButton q={q} />}
              <div style={{ marginLeft: "auto" }}>
                <Suspense fallback={null}>
                  <SortButtons current={sort} />
                </Suspense>
              </div>
            </div>

            {/* Box list */}
            <div style={{ position: "relative" }}>
              <DiscoverLoadingOverlay />
              <Suspense fallback={<BoxSkeleton />}>
                <BoxList sort={sort} prices={prices} pickups={pickups} categories={categories} q={q} />
              </Suspense>
            </div>
          </div>

          {/* Right rail: map + signup */}
          <div>
            <aside style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 130 }}>
              {/* Map */}
              <div className="rise rise-4" style={{
                border: "1px solid var(--border)", borderRadius: 10,
                overflow: "hidden", background: "white",
              }}>
                <MapView stores={storePins} height={200} />
                <div style={{
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 8,
                  borderTop: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    {storePins.filter(s => s.boxCount > 0).length} cửa hàng gần bạn
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>
                    Mở rộng
                  </span>
                </div>
              </div>

              {/* Impact card (logged in) / Signup CTA (logged out) */}
              {impact ? <ImpactCard impact={impact} /> : <SignupCTA />}
            </aside>
          </div>
        </div>
        </DiscoverNavProvider>
      </main>

      <SiteFooter />
    </>
  );
}

function SignupCTA() {
  return (
    <div className="rise rise-5" style={{
      border: "1px solid var(--border)", borderRadius: 10,
      background: "white", padding: 22,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
        Nhận thông báo box mới gần bạn
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
        Box ngon thường hết trong vài phút. Đăng ký để không bỏ lỡ.
      </p>
      <Link href="/register" className="btn btn-primary" style={{
        marginTop: 4, justifyContent: "center", borderRadius: 8,
      }}>
        Đăng ký miễn phí
      </Link>
    </div>
  );
}

function ImpactCard({ impact }: { impact: { orderCount: number; boxCount: number; moneySaved: number; carbonSavedKg: number } }) {
  return (
    <div className="rise rise-5" style={{
      border: "1px solid var(--border)", borderRadius: 10,
      background: "white", padding: 22,
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
        Tác động của bạn
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <ImpactRow label="Đơn hàng đã giải cứu" value={String(impact.orderCount)} color="var(--text)" />
        <ImpactRow label="Tiết kiệm được" value={formatPrice(impact.moneySaved)} color="var(--primary)" />
        <ImpactRow label="CO₂ giảm ước tính" value={`${impact.carbonSavedKg.toFixed(1)} kg`} color="#2d6a31" />
      </div>

      <Link href="/orders" className="btn btn-ghost" style={{
        justifyContent: "center", borderRadius: 8, fontSize: 13,
      }}>
        Xem đơn hàng của tôi
      </Link>
    </div>
  );
}

function ImpactRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}
