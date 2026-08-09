import { Suspense } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, discountPercent, getVietnamToday, formatVNDate, formatVNDateShort, dealBadge, promotionKindLabel } from "@/lib/utils";
import ClaimVoucherButton from "./ClaimVoucherButton";
import MapView from "@/components/MapView";
import type { StorePin } from "@/components/MapView";
import ProductPlaceholderIcon from "@/components/ProductPlaceholderIcon";
import PromotionPlaceholderIcon from "@/components/PromotionPlaceholderIcon";
import LocationPill from "@/components/LocationPill";
import PickupCountdown from "./PickupCountdown";
import FilterSidebar from "./FilterSidebar";
import SortButtons from "./SortButtons";
import ProductTypeTabs from "./ProductTypeTabs";
import ClearSearchButton from "./ClearSearchButton";
import { DiscoverNavProvider } from "./DiscoverNavContext";
import DiscoverLoadingOverlay from "./DiscoverLoadingOverlay";

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
    .filter((s) => s.lat !== null && s.lng !== null && s.boxes.length > 0)
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

  const hasSoon      = pickups.includes("soon");
  const nowHHMM      = vnTimeHHMM(0);
  const twoHoursHHMM = hasSoon ? vnTimeHHMM(120) : "";

  return prisma.box.findMany({
    where: {
      active: true,
      date: { gte: windowStart, lt: to },
      ...(categories.length > 0 && { categoryId: { in: categories } }),
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
    include: { store: true, category: true },
    orderBy: [
      { date: "desc" },
      sort === "price_asc"  ? { priceSale: "asc" } :
      sort === "price_desc" ? { priceSale: "desc" } :
      { quantityLeft: "asc" },
    ],
  });
}

async function getPromotions(q: string, take?: number) {
  const now = new Date();
  return prisma.promotion.findMany({
    where: {
      active: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
      ...(q.trim().length >= 1 ? {
        OR: [
          { title: { contains: q.trim(), mode: "insensitive" as const } },
          { store: { name: { contains: q.trim(), mode: "insensitive" as const } } },
        ],
      } : {}),
    },
    include: { store: true },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
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
        <p style={{ fontSize: 18, fontWeight: 600 }}>Hôm nay chưa có box nào</p>
        <p style={{ fontSize: 15, marginTop: 6 }}>Quay lại sau nhé!</p>
      </div>
    );
  }

  const hasLiveBox = boxes.some((b) => b.date.getTime() >= todayStart.getTime() && b.pickupEnd >= nowHHMM);

  return (
    <>
      {!hasLiveBox && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
          <p style={{ fontSize: 17, fontWeight: 600 }}>Hôm nay chưa có box nào</p>
          <p style={{ fontSize: 15, marginTop: 4 }}>Quay lại sau nhé! Dưới đây là các box đã hết hạn gần đây.</p>
        </div>
      )}
      {boxes.map((box, i) => {
        const disc      = discountPercent(box.priceOriginal, box.priceSale);
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
                : <ProductPlaceholderIcon size={36} style={{ color: "var(--text-muted)", opacity: 0.5 }} />}
            </div>

            {/* Info */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5,
              }}>
                {box.store.name} · {box.store.address.split(",")[0]}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <h3 style={{ fontSize: 20, margin: 0, color: "var(--text)", fontWeight: 700 }}>
                  {box.name}
                </h3>
              </div>
              <div style={{ fontSize: 15, color: "var(--text-muted)" }}>
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
                    <span style={{ fontSize: 23, fontWeight: 800, color: "var(--text)" }}>
                      {formatPrice(box.priceSale)}
                    </span>
                    <span style={{ fontSize: 15, color: "var(--text-muted)", textDecoration: "line-through" }}>
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

async function PromotionList({ q, isLoggedIn }: { q: string; isLoggedIn: boolean }) {
  const promotions = await getPromotions(q);

  if (promotions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Chưa có chương trình khuyến mãi nào</p>
        <p style={{ fontSize: 15, marginTop: 6 }}>Quay lại sau nhé!</p>
      </div>
    );
  }

  return (
    <>
      {promotions.map((promo) => (
        <div key={promo.id} className="box-row-hover" style={{
          display: "grid", gridTemplateColumns: "128px 1fr auto", gap: 24, alignItems: "center",
          padding: "22px 16px", margin: "0 -16px", borderRadius: 12, borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            width: 128, height: 96, borderRadius: 8, overflow: "hidden",
            background: "var(--cream)", display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            {promo.image
              ? <img src={promo.image} alt={promo.title} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6, boxSizing: "border-box" }} />
              : <PromotionPlaceholderIcon kind={promo.kind} size={36} style={{ color: "var(--text-muted)", opacity: 0.5 }} />}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5,
            }}>
              {promo.store.name} · {promo.store.address.split(",")[0]}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{
                padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                background: promo.kind === "PLATFORM_VOUCHER" ? "#ede9fe" : "#e0f2fe",
                color: promo.kind === "PLATFORM_VOUCHER" ? "#6d28d9" : "#0369a1",
              }}>
                {promotionKindLabel(promo.kind)}
              </span>
              <h3 style={{ fontSize: 20, margin: 0, color: "var(--text)", fontWeight: 700 }}>
                {promo.title}
              </h3>
            </div>
            <div style={{ fontSize: 15, color: "var(--text-muted)" }}>
              {promo.kind === "STORE_ANNOUNCEMENT" ? "Áp dụng tại cửa hàng · " : "Hiệu lực "}
              {formatVNDate(promo.validFrom)} – {formatVNDate(promo.validUntil)}
            </div>
          </div>

          <div style={{ paddingLeft: 24, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {dealBadge(promo.dealType, promo.discountValue) && (
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--primary)" }}>
                {dealBadge(promo.dealType, promo.discountValue)}
              </span>
            )}
            {promo.kind === "PLATFORM_VOUCHER" && (
              <ClaimVoucherButton promotionId={promo.id} isLoggedIn={isLoggedIn} />
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// Condensed version shown under the "Tất cả" tab — a horizontally scrollable
// strip of the 5 newest promotions, kept visually distinct (cards, not rows)
// from the box list below so the two don't get mistaken for one list.
async function PromotionCarousel({ q, isLoggedIn }: { q: string; isLoggedIn: boolean }) {
  const promotions = await getPromotions(q, 5);
  if (promotions.length === 0) return null;

  return (
    // Note: setting overflowX without overflowY makes the browser implicitly clip
    // overflowY too (CSS overflow computed-value rule), and overflow only clips at
    // the padding edge — not the content edge. So pad every side generously (the
    // hover shadow + its -2px lift needs room) and cancel the padding with a
    // matching negative margin so the first/last card still lines up visually
    // with the heading above instead of looking indented.
    <div className="promo-carousel" style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -20px", padding: "12px 20px 28px" }}>
      {promotions.map((promo) => (
        <div key={promo.id} className="box-row-hover" style={{
          flex: "0 0 240px", scrollSnapAlign: "start",
          border: "1px solid var(--border)", borderRadius: 14, background: "white",
        }}>
          <div style={{
            position: "relative", height: 110, background: "var(--cream)", display: "grid", placeItems: "center",
            overflow: "hidden", borderRadius: "13px 13px 0 0",
          }}>
            {promo.image
              ? <img src={promo.image} alt={promo.title} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6, boxSizing: "border-box" }} />
              : <PromotionPlaceholderIcon kind={promo.kind} size={32} style={{ color: "var(--text-muted)", opacity: 0.5 }} />}
            {/* Discount — pinned to the image so it always stands out, never competes for text space */}
            {dealBadge(promo.dealType, promo.discountValue) && (
              <span style={{
                position: "absolute", top: 8, left: 8, whiteSpace: "nowrap",
                padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800,
                background: "var(--primary)", color: "white",
              }}>
                {dealBadge(promo.dealType, promo.discountValue)}
              </span>
            )}
          </div>
          <div style={{ padding: 14 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {promo.store.name}
            </div>
            <span style={{
              display: "inline-block", maxWidth: "100%", padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, marginBottom: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              background: promo.kind === "PLATFORM_VOUCHER" ? "#ede9fe" : "#e0f2fe",
              color: promo.kind === "PLATFORM_VOUCHER" ? "#6d28d9" : "#0369a1",
            }}>
              {promotionKindLabel(promo.kind)}
            </span>
            <h3 style={{
              fontSize: 15, margin: "0 0 8px", color: "var(--text)", fontWeight: 700, lineHeight: 1.35,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {promo.title}
            </h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              {/* Validity window — the other must-stand-out fact alongside the discount */}
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {formatVNDateShort(promo.validFrom)} – {formatVNDateShort(promo.validUntil)}
              </span>
              {promo.kind === "PLATFORM_VOUCHER" && (
                <ClaimVoucherButton promotionId={promo.id} isLoggedIn={isLoggedIn} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; price?: string | string[]; pickup?: string | string[]; category?: string | string[]; q?: string; type?: string }>;
}) {
  const sp         = await searchParams;
  const sort       = sp.sort ?? "default";
  const prices     = sp.price    ? (Array.isArray(sp.price)    ? sp.price    : [sp.price])    : [];
  const pickups    = sp.pickup   ? (Array.isArray(sp.pickup)   ? sp.pickup   : [sp.pickup])   : [];
  const categories = sp.category ? (Array.isArray(sp.category) ? sp.category : [sp.category]) : [];
  const q          = sp.q ?? "";
  const productType = sp.type ?? "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [storePins, totalBoxes, impact, categoryOptions, promotionsCount] = await Promise.all([
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
    // Filters (Ngành hàng/Khoảng giá/Giờ nhận) only apply to boxes, not promotions —
    // skip the query and the sidebar entirely on the promotions tab.
    productType === "PROMOTION" ? Promise.resolve([]) : prisma.productCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, key: true, label: true, emoji: true, industry: true },
    }),
    prisma.promotion.count({
      where: { active: true, validFrom: { lte: new Date() }, validUntil: { gte: new Date() } },
    }),
  ]);

  return (
    <>
      <SiteHeader />

      <main className="discover-main">
        <DiscoverNavProvider>
        <div className="discover-layout" style={{ gap: 48, ...(productType === "PROMOTION" && { gridTemplateColumns: "1fr 260px" }) }}>
          {/* Filters sidebar — only meaningful for boxes (Ngành hàng/Khoảng giá/Giờ nhận
              don't filter promotions), so skip the query and the sidebar on that tab */}
          {productType !== "PROMOTION" && (
            <div>
              <Suspense fallback={<div style={{ width: 200, height: 200 }} />}>
                <FilterSidebar categoryOptions={categoryOptions} />
              </Suspense>
            </div>
          )}

          {/* Results — editorial list */}
          <div className="rise rise-4">
            {/* Product type tabs — Surprise Box vs Voucher */}
            <div style={{ marginBottom: 16 }}>
              <Suspense fallback={null}>
                <ProductTypeTabs current={productType} />
              </Suspense>
            </div>

            {/* Promotions — full row list on the dedicated "Chương trình khuyến mãi" tab */}
            {productType === "PROMOTION" && (
              <>
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 12,
                  borderBottom: "2px solid var(--text)", paddingBottom: 14, marginBottom: 12,
                }}>
                  <h2 style={{ fontSize: 30, margin: 0, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    Ưu đãi & khuyến mãi
                  </h2>
                  {q && <span style={{ fontSize: 15, color: "var(--text-muted)" }}>&ldquo;{q}&rdquo;</span>}
                  {q && <ClearSearchButton q={q} />}
                </div>
                <div style={{ position: "relative" }}>
                  <Suspense fallback={<BoxSkeleton />}>
                    <PromotionList q={q} isLoggedIn={!!user} />
                  </Suspense>
                </div>
              </>
            )}

            {/* Promotions — condensed scroll strip alongside the box list on "Tất cả" */}
            {productType === "" && promotionsCount > 0 && (
              <>
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 12,
                  borderBottom: "2px solid var(--text)", paddingBottom: 14, marginBottom: 12,
                }}>
                  <h2 style={{ fontSize: 21, margin: 0, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    Ưu đãi & khuyến mãi
                  </h2>
                  {q && <span style={{ fontSize: 15, color: "var(--text-muted)" }}>&ldquo;{q}&rdquo;</span>}
                  {q && <ClearSearchButton q={q} />}
                  <Link href="/discover?type=PROMOTION" style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none", whiteSpace: "nowrap" }}>
                    Xem tất cả →
                  </Link>
                </div>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <Suspense fallback={<BoxSkeleton />}>
                    <PromotionCarousel q={q} isLoggedIn={!!user} />
                  </Suspense>
                </div>
              </>
            )}

            {/* List header with hairline */}
            {productType !== "PROMOTION" && (
              <>
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 12,
                  borderBottom: "2px solid var(--text)", paddingBottom: 14, marginBottom: 12,
                }}>
                  <h2 style={{ fontSize: 30, margin: 0, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    Hôm nay
                  </h2>
                  <span style={{ fontSize: 15, color: "var(--text-muted)" }}>
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
              </>
            )}
          </div>

          {/* Right rail: map + signup */}
          <div>
            <aside style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 89 }}>
              {/* Map */}
              <div className="rise rise-4" style={{
                border: "1px solid var(--border)", borderRadius: 10,
                overflow: "hidden", background: "white",
              }}>
                <MapView stores={storePins} height={200} />
              </div>

              {/* Location button — standalone, right below map for quick access */}
              <LocationPill bar className="rise rise-4" />

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
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
        Nhận thông báo box mới gần bạn
      </div>
      <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
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
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
        Tác động của bạn
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <ImpactRow label="Đơn hàng đã giải cứu" value={String(impact.orderCount)} color="var(--text)" />
        <ImpactRow label="Tiết kiệm được" value={formatPrice(impact.moneySaved)} color="var(--primary)" />
        <ImpactRow label="CO₂ giảm ước tính" value={`${impact.carbonSavedKg.toFixed(1)} kg`} color="#2d6a31" />
      </div>

      <Link href="/orders" className="btn btn-ghost" style={{
        justifyContent: "center", borderRadius: 8, fontSize: 15,
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
      <span style={{ fontSize: 18, fontWeight: 800, color, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}
