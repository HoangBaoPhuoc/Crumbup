import { Suspense } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { FoodCategory } from "@/app/generated/prisma/enums";
import { formatPrice, discountPercent, getVietnamToday, formatVNDate, categoryEmoji, categoryLabel, FOOD_CATEGORIES } from "@/lib/utils";
import MapView from "@/components/MapView";
import type { StorePin } from "@/components/MapView";
import PickupCountdown from "./PickupCountdown";
import FilterSidebar from "./FilterSidebar";
import SortButtons from "./SortButtons";
import ClearSearchButton from "./ClearSearchButton";
import DiscoverTabs from "./DiscoverTabs";

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

async function getBoxes(sort: string, prices: string[], pickups: string[], categories: string[], q: string) {
  const { from, to } = getVietnamToday();

  const priceOR = prices
    .filter((p) => PRICE_RANGES[p])
    .map((p) => ({ priceSale: PRICE_RANGES[p] }));

  const categoryValues = categories.filter((c): c is FoodCategory => CATEGORY_VALUES.has(c as FoodCategory));

  const hasSoon      = pickups.includes("soon");
  const nowHHMM      = vnTimeHHMM(0);
  const twoHoursHHMM = hasSoon ? vnTimeHHMM(120) : "";

  const textFilter = q.trim().length >= 1 ? {
    OR: [
      { name:  { contains: q.trim(), mode: "insensitive" as const } },
      { store: { name: { contains: q.trim(), mode: "insensitive" as const } } },
    ],
  } : {};

  return prisma.box.findMany({
    where: {
      active: true,
      quantityLeft: { gt: 0 },
      date: { gte: from, lt: to },
      ...textFilter,
      ...(priceOR.length > 0 && { AND: [{ OR: priceOR }] }),
      ...(categoryValues.length > 0 && { category: { in: categoryValues } }),
      ...(hasSoon && {
        pickupEnd:   { gte: nowHHMM },
        pickupStart: { lte: twoHoursHHMM },
      }),
    },
    include: { store: true },
    orderBy:
      sort === "price_asc"  ? { priceSale: "asc" } :
      sort === "price_desc" ? { priceSale: "desc" } :
      { quantityLeft: "asc" },
  });
}


function BoxSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="box-card-row" style={{
          background: "white",
          borderRadius: 18,
          border: "1px solid var(--border)",
          padding: 14,
          display: "grid",
          gridTemplateColumns: "140px 1fr auto",
          gap: 18,
          alignItems: "center",
        }}>
          <div className="box-card-img" style={{ width: 140, height: 140, borderRadius: 14, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ height: 14, width: "30%", borderRadius: 6, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 20, width: "60%", borderRadius: 6, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 28, width: "40%", borderRadius: 6, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 12, width: "70%", borderRadius: 6, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
          <div style={{ width: 80, height: 36, borderRadius: 999, background: "var(--cream)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      ))}
    </div>
  );
}

async function BoxList({ sort, prices, pickups, categories, q }: { sort: string; prices: string[]; pickups: string[]; categories: string[]; q: string }) {
  const boxes = await getBoxes(sort, prices, pickups, categories, q);
  const nowHHMM = vnTimeHHMM(0);

  if (boxes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 16, fontWeight: 600 }}>Hôm nay chưa có box nào</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Quay lại sau nhé!</p>
      </div>
    );
  }

  return (
    <>
      {boxes.map((box, i) => {
        const disc      = discountPercent(box.priceOriginal, box.priceSale);
        const emoji     = categoryEmoji(box.category);
        const isLow     = box.quantityLeft <= 2;
        const isExpired = box.pickupEnd < nowHHMM;
        const tone      = i % 2 === 0 ? "warm" : "cream";

        const card = (
          <div
            className="card-hover card-hover-warm"
            style={{
              background: "white",
              borderRadius: 18,
              border: "1px solid var(--border)",
              padding: 14,
              display: "grid",
              gridTemplateColumns: "140px 1fr auto",
              gap: 18,
              alignItems: "center",
              opacity: isExpired ? 0.55 : 1,
              filter: isExpired ? "grayscale(0.85)" : "none",
            }}>
            <div className="box-card-img" style={{
              position: "relative",
              width: 140, height: 140, borderRadius: 14, fontSize: 56, flexShrink: 0,
              background: tone === "warm"
                ? "linear-gradient(135deg, #fde6d4, #f5d4b3)"
                : "linear-gradient(135deg, #fdf5e6, #e8dcc6)",
              display: "grid", placeItems: "center", overflow: "hidden",
            }}>
              {box.image
                ? <img src={box.image} alt={box.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : emoji}
              {!isExpired && (
                <span style={{
                  position: "absolute", top: 8, left: 8,
                  background: isLow ? "var(--danger)" : "rgba(61,47,31,0.72)", color: "white",
                  fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999,
                }}>
                  Còn {box.quantityLeft}
                </span>
              )}
            </div>

            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {isExpired && <span className="badge" style={{ background: "#e5e7eb", color: "#6b7280" }}>Đã hết giờ</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  {box.store.name}
                </div>
                <span className="badge" style={{ background: "var(--cream)", color: "var(--text-muted)", fontWeight: 600 }}>
                  {categoryEmoji(box.category)} {categoryLabel(box.category)}
                </span>
              </div>
              <h3 style={{ fontSize: 18, margin: "4px 0 10px" }}>{box.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: isExpired ? "var(--text-muted)" : "var(--primary)" }}>
                  {formatPrice(box.priceSale)}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "line-through" }}>
                  {formatPrice(box.priceOriginal)}
                </span>
                {!isExpired && <span className="badge badge-primary">−{disc}%</span>}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span>{box.pickupStart} – {box.pickupEnd}</span>
                <span>{box.store.address.split(",")[0]}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                {formatVNDate(box.date)}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
              {isExpired ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", whiteSpace: "nowrap" }}>Đã hết giờ</span>
              ) : (
                <>
                  <PickupCountdown pickupStart={box.pickupStart} pickupEnd={box.pickupEnd} />
                  <span className="btn btn-primary" style={{ padding: "12px 24px", fontSize: 14, boxShadow: "0 8px 20px -6px rgba(184,124,82,.6)" }}>Đặt ngay →</span>
                </>
              )}
            </div>
          </div>
        );

        return (
          <Link key={box.id} href={`/box/${box.id}`} className="box-card-row" style={{ textDecoration: "none" }}>
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
  const storePins = await getStorePins();

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
        <div className="discover-layout" style={{ gap: 24 }}>
          {/* Filters sidebar */}
          <div>
            <Suspense fallback={<div style={{ width: 220, height: 200, borderRadius: 20, background: "var(--cream)" }} />}>
              <FilterSidebar />
            </Suspense>
          </div>

          {/* Results */}
          <div className="rise rise-4" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ fontSize: 22, flex: 1 }}>Box hôm nay</h2>
              {q && <ClearSearchButton q={q} />}
              <Suspense fallback={null}>
                <SortButtons current={sort} />
              </Suspense>
            </div>
            <Suspense fallback={<BoxSkeleton />}>
              <BoxList sort={sort} prices={prices} pickups={pickups} categories={categories} q={q} />
            </Suspense>
          </div>

          {/* Right sidebar (map + impact) */}
          <div>
            <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 130 }}>

              {/* Map */}
              <div className="rise rise-4" style={{
                background: "white",
                borderRadius: 20,
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}>
                <MapView stores={storePins} height={220} />
                <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
                  Bấm vị trí trên header để định vị
                </div>
              </div>

              {/* Conversion banner — replaces the old empty "— box / — kg" impact placeholder */}
              <div className="rise rise-5" style={{
                background: "linear-gradient(135deg, var(--badge) 0%, #f7d27a 100%)",
                borderRadius: 20,
                padding: 22,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Đăng ký để nhận thông báo box mới</div>
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, opacity: 0.85 }}>
                  Box ngon hết nhanh trong vài phút — đăng ký để không bỏ lỡ ưu đãi gần bạn.
                </div>
                <Link href="/register" className="btn btn-dark" style={{ marginTop: 6, justifyContent: "center" }}>
                  Đăng ký miễn phí
                </Link>
              </div>

            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
