export function formatPrice(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

// Category taxonomy now lives in the `ProductCategory` table (see prisma/schema.prisma)
// instead of a hardcoded enum — fetch it server-side and pass it down as props.
export type CategoryOption = {
  id: string;
  key: string;
  label: string;
  emoji: string | null;
  industry: string | null;
};

export const INDUSTRY_OPTIONS = [
  { value: "BAKERY_CAFE",             label: "Bakery & Café" },
  { value: "SUPERMARKET_CONVENIENCE", label: "Siêu thị & tiện lợi" },
] as const;

export type IndustryValue = (typeof INDUSTRY_OPTIONS)[number]["value"];

export function industryLabel(industry: string | null | undefined): string {
  return INDUSTRY_OPTIONS.find((i) => i.value === industry)?.label ?? "Khác";
}

export const DEAL_TYPE_OPTIONS = [
  { value: "PERCENT_OFF",      label: "Giảm theo %" },
  { value: "FIXED_AMOUNT_OFF", label: "Giảm số tiền cố định" },
  { value: "BOGO",             label: "Mua 1 tặng 1" },
  { value: "FREEBIE",          label: "Tặng kèm miễn phí" },
  { value: "OTHER",            label: "Khác" },
] as const;

export type DealTypeValue = (typeof DEAL_TYPE_OPTIONS)[number]["value"];

export function dealTypeLabel(dealType: string | null | undefined): string {
  return DEAL_TYPE_OPTIONS.find((d) => d.value === dealType)?.label ?? "Khác";
}

/** Short display badge for a voucher's deal, e.g. "-25%", "-50.000đ", "Mua 1 tặng 1". */
export function dealBadge(dealType: string | null | undefined, discountValue: number | null | undefined): string | null {
  switch (dealType) {
    case "PERCENT_OFF":      return discountValue != null ? `-${discountValue}%` : null;
    case "FIXED_AMOUNT_OFF": return discountValue != null ? `-${formatPrice(discountValue)}` : null;
    case "BOGO":             return "Mua 1 tặng 1";
    case "FREEBIE":          return "Tặng kèm";
    default:                 return null;
  }
}

export const PROMOTION_KIND_OPTIONS = [
  { value: "PLATFORM_VOUCHER",   label: "Mã khuyến mãi nền tảng", emoji: "🎟️" },
  { value: "STORE_ANNOUNCEMENT", label: "Quảng cáo chương trình tại cửa hàng", emoji: "📣" },
] as const;

export type PromotionKindValue = (typeof PROMOTION_KIND_OPTIONS)[number]["value"];

export function promotionKindLabel(kind: string | null | undefined): string {
  return PROMOTION_KIND_OPTIONS.find((k) => k.value === kind)?.label ?? "Khuyến mãi";
}

export function promotionKindEmoji(kind: string | null | undefined): string {
  return PROMOTION_KIND_OPTIONS.find((k) => k.value === kind)?.emoji ?? "🎟️";
}

export const PRODUCT_TYPES = [
  { value: "SURPRISE_BOX", label: "Surprise Box", emoji: "🎁" },
  { value: "VOUCHER",      label: "Chương trình khuyến mãi", emoji: "🎟️" },
] as const;

export type ProductTypeValue = (typeof PRODUCT_TYPES)[number]["value"];

export function productTypeLabel(productType: string): string {
  return PRODUCT_TYPES.find((p) => p.value === productType)?.label ?? "Surprise Box";
}

export function productTypeEmoji(productType: string): string {
  return PRODUCT_TYPES.find((p) => p.value === productType)?.emoji ?? "🎁";
}

export function discountPercent(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

const VN_DAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

/** Formats a Date as "T6, 30/05" in Vietnam time (UTC+7). */
export function formatVNDate(date: Date): string {
  const d = new Date(date.getTime() + 7 * 60 * 60_000);
  const dow = VN_DAYS[d.getUTCDay()];
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dow}, ${day}/${mon}`;
}

/** Returns start-of-day and end-of-day Date objects in Vietnam time (UTC+7). */
export function getVietnamToday(): { from: Date; to: Date } {
  const now = new Date();
  const vnOffset = 7 * 60 * 60 * 1000;
  const vnNow = new Date(now.getTime() + vnOffset);
  const from = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}
