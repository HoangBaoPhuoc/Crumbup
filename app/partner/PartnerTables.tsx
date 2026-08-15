"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BoxToggle from "./BoxToggle";
import PartnerOrderActions from "./PartnerOrderActions";
import EditBoxModal from "./EditBoxModal";
import { TIME_FILTER_OPTIONS, timeFilterStart, type CategoryOption, type TimeFilter } from "@/lib/utils";

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
type OrderStatusFilter = "all" | "PENDING" | "CONFIRMED" | "PICKED_UP" | "CANCELLED";
const ORDER_STATUS_FILTER_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: "all",        label: "Tất cả trạng thái" },
  { value: "PENDING",    label: STATUS_LABEL.PENDING },
  { value: "CONFIRMED",  label: STATUS_LABEL.CONFIRMED },
  { value: "PICKED_UP",  label: STATUS_LABEL.PICKED_UP },
  { value: "CANCELLED",  label: STATUS_LABEL.CANCELLED },
];

type Box = {
  id: string; name: string; description: string | null; image: string | null;
  categoryId: string; category: { id: string; label: string; emoji: string | null } | null;
  priceOriginal: number; priceSale: number;
  quantityTotal: number; quantityLeft: number;
  pickupStart: string; pickupEnd: string; active: boolean;
  date: Date | string;
};
type Order = {
  id: string; total: number; status: string; pickupCode: string; createdAt: Date;
  user: { id: string; name: string };
  items: { box: { name: string } }[];
};

type BoxScope = "today" | "week" | "month" | "all";
const BOX_SCOPE_OPTIONS: { value: BoxScope; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "week",  label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "all",   label: "Tất cả" },
];

type BoxStatusFilter = "all" | "selling" | "out_of_stock" | "paused" | "scheduled";
const BOX_STATUS_FILTER_OPTIONS: { value: BoxStatusFilter; label: string }[] = [
  { value: "all",           label: "Tất cả trạng thái" },
  { value: "selling",       label: "Đang bán" },
  { value: "out_of_stock",  label: "Hết hàng" },
  { value: "paused",        label: "Tạm dừng" },
  { value: "scheduled",     label: "Đã lên lịch" },
];

function boxStatus(b: Box, isToday: boolean): Exclude<BoxStatusFilter, "all"> {
  if (!isToday) return b.active ? "scheduled" : "paused";
  if (b.quantityLeft === 0) return "out_of_stock";
  return b.active ? "selling" : "paused";
}

// End (exclusive) of the current Mon-Sun week / calendar month — used to bound
// "Tuần này" / "Tháng này" scope for upcoming boxes (today's date and later).
function endOfWeek(now: Date): Date {
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7);
}
function endOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function fmtVN(date: Date | string) {
  const d = new Date(new Date(date).getTime() + 7 * 60 * 60_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "13px 20px", fontSize: 15, color: "var(--text)" };

export default function PartnerTables({
  activeBoxes, futureBoxes, recentOrders, totalOrders, hasBoxHistory, categories,
}: {
  activeBoxes:  Box[];
  futureBoxes:  Box[];
  recentOrders: Order[];
  totalOrders:  number;
  hasBoxHistory: boolean;
  categories:   CategoryOption[];
}) {
  const [boxQ,      setBoxQ]      = useState("");
  const [boxScope,  setBoxScope]  = useState<BoxScope>("today");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [boxStatusFilter, setBoxStatusFilter] = useState<BoxStatusFilter>("all");
  const [editBox,   setEditBox]   = useState<Box | null>(null);

  const [orderQ,      setOrderQ]      = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>("all");
  const [orderTimeFilter, setOrderTimeFilter] = useState<TimeFilter>("all");

  const now = useMemo(() => new Date(), []);
  const todayStr  = new Date(Date.now() + 7 * 60 * 60_000).toISOString().slice(0, 10);
  const allBoxes  = [...activeBoxes, ...futureBoxes];

  const scopedBoxes = useMemo(() => {
    if (boxScope === "today") return activeBoxes;
    if (boxScope === "week")  return [...activeBoxes, ...futureBoxes.filter((b) => new Date(b.date) < endOfWeek(now))];
    if (boxScope === "month") return [...activeBoxes, ...futureBoxes.filter((b) => new Date(b.date) < endOfMonth(now))];
    return allBoxes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxScope, activeBoxes, futureBoxes, now]);

  const filteredBoxes = useMemo(() => {
    const q = boxQ.toLowerCase();
    return scopedBoxes.filter((b) => {
      const isToday = new Date(b.date).toISOString().slice(0, 10) === todayStr;
      const matchesQ = b.name.toLowerCase().includes(q) || (b.description ?? "").toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || b.categoryId === categoryFilter;
      const matchesStatus = boxStatusFilter === "all" || boxStatus(b, isToday) === boxStatusFilter;
      return matchesQ && matchesCategory && matchesStatus;
    });
  }, [scopedBoxes, boxQ, categoryFilter, boxStatusFilter, todayStr]);

  const filteredOrders = useMemo(() => {
    const q = orderQ.toLowerCase();
    const timeStart = orderTimeFilter === "all" ? null : timeFilterStart(orderTimeFilter, now);
    return recentOrders.filter((o) => {
      const matchesQ = !q ||
        o.user.name.toLowerCase().includes(q) ||
        o.pickupCode.toLowerCase().includes(q) ||
        (o.items[0]?.box.name ?? "").toLowerCase().includes(q) ||
        STATUS_LABEL[o.status].toLowerCase().includes(q);
      const matchesStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
      const matchesTime = !timeStart || new Date(o.createdAt) >= timeStart;
      return matchesQ && matchesStatus && matchesTime;
    });
  }, [recentOrders, orderQ, orderStatusFilter, orderTimeFilter, now]);

  return (
    <>
      {/* ── Boxes ── */}
      <section id="boxes" style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--cream)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Box đang bán</h2>

          <select value={boxScope} onChange={(e) => setBoxScope(e.target.value as BoxScope)}
            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", cursor: "pointer" }}>
            {BOX_SCOPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <input
            value={boxQ} onChange={(e) => setBoxQ(e.target.value)}
            placeholder="Tìm box..."
            style={{ padding: "6px 12px", fontSize: 15, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", width: 180 }}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", cursor: "pointer" }}>
            <option value="">Tất cả ngành hàng</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={boxStatusFilter} onChange={(e) => setBoxStatusFilter(e.target.value as BoxStatusFilter)}
            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", cursor: "pointer" }}>
            {BOX_STATUS_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", marginLeft: "auto" }}>
            {filteredBoxes.length}/{scopedBoxes.length} box
          </span>
        </div>

        {scopedBoxes.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              Không có box nào đang bán hoặc sắp tới
            </div>
            <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
              {hasBoxHistory
                ? "Mục này chỉ hiển thị box hôm nay và sắp tới — box đã qua ngày nằm trong "
                : "Dùng nút “Tạo box mới” ở đầu trang để bắt đầu bán hàng."}
              {hasBoxHistory && <Link href="/partner?tab=box-history" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "underline" }}>Lịch sử box</Link>}
              {hasBoxHistory && "."}
            </p>
          </div>
        ) : filteredBoxes.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
            Không tìm thấy box nào khớp với bộ lọc
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                {["Ngày", "Tên box", "Giá gốc", "Giá bán", "Còn lại", "Giờ nhận", "Trạng thái", "", ""].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBoxes.map((b, idx) => {
                const isToday = new Date(b.date).toISOString().slice(0, 10) === todayStr;
                const sold    = b.quantityTotal - b.quantityLeft;
                const pct     = b.quantityTotal > 0 ? Math.round((sold / b.quantityTotal) * 100) : 0;
                const status  = boxStatus(b, isToday);
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid var(--border)", background: idx % 2 === 1 ? "var(--cream)" : "white", opacity: b.active ? 1 : 0.5 }}>
                    <td style={{ ...td, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {isToday
                        ? <span style={{ fontWeight: 700, color: "var(--primary)" }}>Hôm nay</span>
                        : new Date(new Date(b.date).getTime() + 7 * 60 * 60_000).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
                      {b.category && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{b.category.emoji} {b.category.label}</div>}
                      {b.description && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{b.description}</div>}
                    </td>
                    <td style={{ ...td, color: "var(--text-muted)", textDecoration: "line-through", fontSize: 12 }}>
                      {b.priceOriginal.toLocaleString("vi-VN")}đ
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: "var(--primary)" }}>
                      {b.priceSale.toLocaleString("vi-VN")}đ
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>
                        -{Math.round((1 - b.priceSale / b.priceOriginal) * 100)}%
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{b.quantityLeft}/{b.quantityTotal}</div>
                      <div style={{ marginTop: 4, height: 4, background: "var(--cream)", borderRadius: 999, width: 60 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "var(--primary)", borderRadius: 999 }} />
                      </div>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: "var(--text-muted)" }}>{b.pickupStart} – {b.pickupEnd}</td>
                    <td style={td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: status === "selling" ? "var(--primary-soft)" : status === "scheduled" ? "var(--blue)" : status === "out_of_stock" ? "#f1f5f9" : "#fef3c7",
                        color: status === "selling" ? "var(--primary-dark)" : status === "scheduled" ? "var(--blue-strong)" : status === "out_of_stock" ? "#64748b" : "#92400e",
                      }}>
                        {status === "selling" ? "Đang bán" : status === "scheduled" ? "Đã lên lịch" : status === "out_of_stock" ? "Hết hàng" : "Tạm dừng"}
                      </span>
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => setEditBox(b)}
                        style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--ivory)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", whiteSpace: "nowrap" }}
                      >
                        Sửa
                      </button>
                    </td>
                    <td style={td}><BoxToggle boxId={b.id} active={b.active} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {editBox && <EditBoxModal box={editBox} categories={categories} onClose={() => setEditBox(null)} />}

      {/* ── Orders ── */}
      <section id="orders" style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--cream)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginRight: "auto" }}>Đơn hàng đang xử lý</h2>
          <input
            value={orderQ} onChange={(e) => setOrderQ(e.target.value)}
            placeholder="Tìm theo tên, mã đơn..."
            style={{ padding: "6px 12px", fontSize: 15, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", width: 200 }}
          />
          <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatusFilter)}
            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", cursor: "pointer" }}>
            {ORDER_STATUS_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={orderTimeFilter} onChange={(e) => setOrderTimeFilter(e.target.value as TimeFilter)}
            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", cursor: "pointer" }}>
            {TIME_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {filteredOrders.length}/{recentOrders.length} đơn đang xử lý
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
            {totalOrders > 0 ? (
              <>
                Không có đơn nào đang chờ xử lý. Mục này chỉ hiển thị đơn đang chờ xác nhận/nhận hàng —
                các đơn đã hoàn tất, hủy, hoặc hết hạn nằm trong{" "}
                <Link href="/partner?tab=order-history" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "underline" }}>
                  Lịch sử đơn hàng
                </Link>.
              </>
            ) : (
              "Chưa có đơn hàng nào"
            )}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
            Không tìm thấy đơn nào khớp với bộ lọc
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                {["Mã đơn", "Khách hàng", "Box", "Tổng tiền", "Thời gian", "Trạng thái", "Thao tác"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o, idx) => (
                <tr key={o.id} style={{ borderTop: "1px solid var(--border)", background: idx % 2 === 1 ? "var(--cream)" : "white" }}>
                  <td style={td}>
                    <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: 12 }}>#{o.pickupCode.slice(0, 8).toUpperCase()}</div>
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{o.user.name}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--text-muted)" }}>{o.items[0]?.box.name ?? "—"}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{o.total.toLocaleString("vi-VN")}đ</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--text-muted)" }}>
                    {fmtVN(o.createdAt)}
                  </td>
                  <td style={td}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, ...STATUS_COLOR[o.status] }}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td style={td}>
                    <PartnerOrderActions orderId={o.id} customerId={o.user.id} status={o.status as "PENDING" | "CONFIRMED" | "PICKED_UP" | "CANCELLED"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

    </>
  );
}
