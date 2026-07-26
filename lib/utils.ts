export function formatPrice(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export const FOOD_CATEGORIES = [
  { value: "BANH_NGOT",   label: "Bánh ngọt",   emoji: "🥐" },
  { value: "BANH_MI",     label: "Bánh mì",     emoji: "🥖" },
  { value: "DO_UONG",     label: "Đồ uống",     emoji: "☕" },
  { value: "MON_MAN",     label: "Món mặn",     emoji: "🥪" },
  { value: "TRANG_MIENG", label: "Tráng miệng", emoji: "🧁" },
  { value: "KHAC",        label: "Khác",        emoji: "🎁" },
  { value: "SUPERMARKET_CONVENIENCE", label: "Siêu thị/tiện lợi", emoji: "🏪" },
  { value: "PRODUCE",                 label: "Trái cây/rau củ",   emoji: "🥦" },
  { value: "LOCAL_SPECIALTY",         label: "Đặc sản đóng gói",  emoji: "🍯" },
] as const;

export type FoodCategoryValue = (typeof FOOD_CATEGORIES)[number]["value"];

export function categoryEmoji(category: string): string {
  return FOOD_CATEGORIES.find((c) => c.value === category)?.emoji ?? "🎁";
}

export function categoryLabel(category: string): string {
  return FOOD_CATEGORIES.find((c) => c.value === category)?.label ?? "Khác";
}

export const PRODUCT_TYPES = [
  { value: "SURPRISE_BOX", label: "Surprise Box", emoji: "🎁" },
  { value: "VOUCHER",      label: "Voucher",       emoji: "🎟️" },
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
