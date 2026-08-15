import { Suspense } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, discountPercent, getVietnamToday, formatVNDate, formatVNDateShort } from "@/lib/utils";
import MapView from "@/components/MapView";
import type { StorePin } from "@/components/MapView";
import ProductPlaceholderIcon from "@/components/ProductPlaceholderIcon";
import AnnouncementCard, { type PromotionWithStore } from "@/components/AnnouncementCard";
import VoucherCard from "@/components/VoucherCard";
import PromoStrip from "@/components/PromoStrip";
import LocationPill from "@/components/LocationPill";
import PickupCountdown from "./PickupCountdown";
import FilterSidebar from "./FilterSidebar";
import SortButtons from "./SortButtons";
import ProductTypeTabs from "./ProductTypeTabs";
import ClearSearchButton from "./ClearSearchButton";
import { DiscoverNavProvider } from "./DiscoverNavContext";
import DiscoverLoadingOverlay from "./DiscoverLoadingOverlay";
import BoxPagination from "./BoxPagination";

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
  low: { lt: 50_000 },
  mid: { gte: 50_000, lt: 100_000 },
  high: { gte: 100_000, lte: 150_000 },
};

// How many days of past (expired) boxes to still show, dimmed and unclickable, below today's boxes.
const PAST_DAYS_SHOWN = 100;
const BOX_PAGE_SIZE = 20;

function buildBoxWhere(prices: string[], pickups: string[], categories: string[], q: string) {
  const { from, to } = getVietnamToday();
  const windowStart = new Date(from.getTime() - PAST_DAYS_SHOWN * 24 * 60 * 60 * 1000);

  const priceOR = prices
    .filter((p) => PRICE_RANGES[p])
    .map((p) => ({ priceSale: PRICE_RANGES[p] }));

  const hasSoon = pickups.includes("soon");
  const nowHHMM = vnTimeHHMM(0);
  const twoHoursHHMM = hasSoon ? vnTimeHHMM(120) : "";

  return {
    active: true,
    date: { gte: windowStart, lt: to },
    ...(categories.length > 0 && { categoryId: { in: categories } }),
    AND: [
      // Today's boxes must still have stock; past days show regardless (they're expired either way).
      { OR: [{ date: { gte: from }, quantityLeft: { gt: 0 } }, { date: { lt: from } }] },
      ...(q.trim().length >= 1 ? [{
        OR: [
          { name: { contains: q.trim(), mode: "insensitive" as const } },
          { store: { name: { contains: q.trim(), mode: "insensitive" as const } } },
        ],
      }] : []),
      ...(priceOR.length > 0 ? [{ OR: priceOR }] : []),
      ...(hasSoon ? [{ pickupEnd: { gte: nowHHMM }, pickupStart: { lte: twoHoursHHMM } }] : []),
    ],
  };
}

async function getBoxes(sort: string, prices: string[], pickups: string[], categories: string[], q: string, page: number) {
  const where = buildBoxWhere(prices, pickups, categories, q);

  const [boxes, totalCount] = await Promise.all([
    prisma.box.findMany({
      where,
      include: { store: true, category: true },
      orderBy: [
        { date: "desc" },
        sort === "price_asc" ? { priceSale: "asc" } :
          sort === "price_desc" ? { priceSale: "desc" } :
            { quantityLeft: "asc" },
      ],
      skip: (page - 1) * BOX_PAGE_SIZE,
      take: BOX_PAGE_SIZE,
    }),
    prisma.box.count({ where }),
  ]);

  return { boxes, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / BOX_PAGE_SIZE)) };
}

async function getPromotions(q: string, take?: number, kind?: "PLATFORM_VOUCHER" | "STORE_ANNOUNCEMENT") {
  const now = new Date();
  return prisma.promotion.findMany({
    where: {
      active: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
      ...(kind ? { kind } : {}),
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

async function BoxList({ sort, prices, pickups, categories, q, page }: { sort: string; prices: string[]; pickups: string[]; categories: string[]; q: string; page: number }) {
  const { boxes, totalPages } = await getBoxes(sort, prices, pickups, categories, q, page);
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
        const disc = discountPercent(box.priceOriginal, box.priceSale);
        const isLow = box.quantityLeft <= 2;
        const isPastDay = box.date.getTime() < todayStart.getTime();
        const isExpired = isPastDay || box.pickupEnd < nowHHMM;
        const tone = i % 2 === 0 ? "warm" : "cream";

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

      {totalPages > 1 && (
        <Suspense fallback={null}>
          <BoxPagination page={page} totalPages={totalPages} />
        </Suspense>
      )}
    </>
  );
}

// Blue for announcements (informational, nothing to claim) vs primary/red for
// vouchers (actionable, matches the claim button and discount-value color
// already used on VoucherCard) — a quick color cue for which kind is which,
// instead of both pills sharing the same neutral dark tone.
// --blue-strong (#5e8fc5) reads too washed-out on --blue (#d2e8ff) — a
// mid-tone blue on a light-blue bg doesn't have enough contrast to read as
// text. Use a much darker navy here instead (shared --blue-strong var stays
// untouched since it's also used for status badges elsewhere).
const announcementPillStyle: React.CSSProperties = {
  padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
  background: "var(--blue)", color: "#1c4a7a", whiteSpace: "nowrap",
};
const voucherPillStyle: React.CSSProperties = {
  padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
  background: "var(--primary-soft)", color: "var(--primary-dark)", whiteSpace: "nowrap",
};

// One kind per tab now — platform vouchers (claimable, ticket-notched, no
// photo) and store announcements (informational, photo-led) used to share a
// single "Chương trình khuyến mãi" tab/list, but looked similar enough at a
// glance that mixing them together made people mistake one for the other.
async function PromotionKindList({ q, isLoggedIn, kind }: { q: string; isLoggedIn: boolean; kind: "PLATFORM_VOUCHER" | "STORE_ANNOUNCEMENT" }) {
  const isVoucher = kind === "PLATFORM_VOUCHER";
  const promos = await getPromotions(q, undefined, kind);

  if (promos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>
          {isVoucher ? "Chưa có mã giảm giá nào" : "Chưa có chương trình khuyến mãi nào"}
        </p>
        <p style={{ fontSize: 15, marginTop: 6 }}>Quay lại sau nhé!</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={isVoucher ? voucherPillStyle : announcementPillStyle}>
          {isVoucher ? "áp dụng trực tiếp tại cửa hàng" : "mới nhất tại cửa hàng"}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
          {promos.length} {isVoucher ? "mã" : "chương trình"}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {isVoucher
          ? promos.map((promo) => <VoucherCard key={promo.id} promo={promo} isLoggedIn={isLoggedIn} />)
          : promos.map((promo) => <AnnouncementCard key={promo.id} promo={promo} />)}
      </div>
    </div>
  );
}

// Condensed version shown under the "Tất cả" tab — both kinds together
// (unlike the dedicated per-kind tabs), each a horizontally-scrollable strip
// with prev/next arrows instead of wrapping, since this widget sits above
// the box list and
// shouldn't grow tall.
async function PromotionCarousel({ q, isLoggedIn }: { q: string; isLoggedIn: boolean }) {
  const [vouchers, announcements] = await Promise.all([
    getPromotions(q, 8, "PLATFORM_VOUCHER"),
    getPromotions(q, 8, "STORE_ANNOUNCEMENT"),
  ]);

  if (vouchers.length === 0 && announcements.length === 0) {
    return (
      <div style={{ padding: "16px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
        Hiện chưa có chương trình khuyến mãi hay mã giảm giá nào đang chạy — quay lại sau nhé!
      </div>
    );
  }

  return (
    <div>
      {announcements.length > 0 && (
        <PromoStrip
          title="Chương trình khuyến mãi" pillLabel="mới nhất tại cửa hàng"
          pillBg="var(--blue)" pillColor="#1c4a7a"
          count={announcements.length} countLabel="chương trình"
          seeAllHref="/discover?type=ANNOUNCEMENT"
        >
          {announcements.map((promo) => <AnnouncementCard key={promo.id} promo={promo} />)}
        </PromoStrip>
      )}
      {vouchers.length > 0 && announcements.length > 0 && (
        <div style={{ height: 1, background: "var(--border)", margin: "8px 0 12px" }} />
      )}
      {vouchers.length > 0 && (
        <PromoStrip
          title="Mã giảm giá" pillLabel="áp dụng trực tiếp tại cửa hàng"
          pillBg="var(--primary-soft)" pillColor="var(--primary-dark)"
          count={vouchers.length} countLabel="mã"
          seeAllHref="/discover?type=VOUCHER"
        >
          {vouchers.map((promo) => <VoucherCard key={promo.id} promo={promo} isLoggedIn={isLoggedIn} />)}
        </PromoStrip>
      )}
    </div>
  );
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; price?: string | string[]; pickup?: string | string[]; category?: string | string[]; q?: string; type?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const sort = sp.sort ?? "default";
  const prices = sp.price ? (Array.isArray(sp.price) ? sp.price : [sp.price]) : [];
  const pickups = sp.pickup ? (Array.isArray(sp.pickup) ? sp.pickup : [sp.pickup]) : [];
  const categories = sp.category ? (Array.isArray(sp.category) ? sp.category : [sp.category]) : [];
  const q = sp.q ?? "";
  const productType = sp.type ?? "";
  const isPromoTab = productType === "ANNOUNCEMENT" || productType === "VOUCHER";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [storePins, totalBoxes, impact, categoryOptions] = await Promise.all([
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
    // skip the query and the sidebar entirely on the promotions tabs.
    isPromoTab ? Promise.resolve([]) : prisma.productCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, key: true, label: true, emoji: true, industry: true },
    }),
  ]);

  return (
    <>
      <SiteHeader />

      <main className="discover-main">
        <DiscoverNavProvider>
          <div className="discover-layout" style={{ gap: 48, ...(isPromoTab && { gridTemplateColumns: "1fr 260px" }) }}>
            {/* Filters sidebar — only meaningful for boxes (Ngành hàng/Khoảng giá/Giờ nhận
              don't filter promotions), so skip the query and the sidebar on those tabs */}
            {!isPromoTab && (
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

              {/* Promotions — full row list on the dedicated per-kind tabs */}
              {isPromoTab && (
                <>
                  <div style={{
                    display: "flex", alignItems: "baseline", gap: 12,
                    borderBottom: "2px solid var(--text)", paddingBottom: 14, marginBottom: 12,
                  }}>
                    <h2 style={{ fontSize: 30, margin: 0, color: "var(--text)", letterSpacing: "-0.02em" }}>
                      {productType === "VOUCHER" ? "Mã giảm giá" : "Chương trình khuyến mãi"}
                    </h2>
                    {q && <span style={{ fontSize: 15, color: "var(--text-muted)" }}>&ldquo;{q}&rdquo;</span>}
                    {q && <ClearSearchButton q={q} />}
                  </div>
                  <div style={{ position: "relative" }}>
                    <Suspense fallback={<BoxSkeleton />}>
                      <PromotionKindList q={q} isLoggedIn={!!user} kind={productType === "VOUCHER" ? "PLATFORM_VOUCHER" : "STORE_ANNOUNCEMENT"} />
                    </Suspense>
                  </div>
                </>
              )}

              {/* Promotions — condensed scroll strip alongside the box list on "Tất cả".
                  Heading always shows here (even with zero active promos right now) —
                  it's part of the page's structure, not something that should vanish
                  just because nothing happens to be running today. */}
              {productType === "" && (
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
                  </div>
                  <div style={{ position: "relative", marginBottom: 8 }}>
                    <Suspense fallback={<BoxSkeleton />}>
                      <PromotionCarousel q={q} isLoggedIn={!!user} />
                    </Suspense>
                  </div>
                </>
              )}

              {/* List header with hairline */}
              {!isPromoTab && (
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
                      <BoxList sort={sort} prices={prices} pickups={pickups} categories={categories} q={q} page={page} />
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
                <LocationPill bar />

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
        <ImpactRow label="CO₂ giảm ước tính" value={`${impact.carbonSavedKg.toFixed(1)} kg`} color="#3986aaff" />
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
