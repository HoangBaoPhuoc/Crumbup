"use client";

import { useState } from "react";
import BoxToggle from "./BoxToggle";
import PartnerOrderActions from "./PartnerOrderActions";
import CreateBoxModal from "./CreateBoxModal";
import EditBoxModal from "./EditBoxModal";

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

type Box = {
  id: string; name: string; description: string | null; image: string | null;
  category: string;
  priceOriginal: number; priceSale: number;
  quantityTotal: number; quantityLeft: number;
  pickupStart: string; pickupEnd: string; active: boolean;
  date: Date | string;
};
type Order = {
  id: string; total: number; status: string; pickupCode: string; createdAt: Date;
  user: { name: string };
  items: { box: { name: string } }[];
};

function fmtVN(date: Date | string) {
  const d = new Date(new Date(date).getTime() + 7 * 60 * 60_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "13px 20px", fontSize: 13, color: "var(--text)" };

export default function PartnerTables({
  activeBoxes, futureBoxes, recentOrders, totalOrders, storeAddress,
}: {
  activeBoxes:  Box[];
  futureBoxes:  Box[];
  recentOrders: Order[];
  totalOrders:  number;
  storeAddress: string;
}) {
  const [boxQ,     setBoxQ]     = useState("");
  const [boxScope, setBoxScope] = useState<"today" | "all">("today");
  const [editBox,  setEditBox]  = useState<Box | null>(null);
  const [orderQ,   setOrderQ]   = useState("");

  const todayStr  = new Date(Date.now() + 7 * 60 * 60_000).toISOString().slice(0, 10);
  const allBoxes  = [...activeBoxes, ...futureBoxes];
  const scopedBoxes = boxScope === "today" ? activeBoxes : allBoxes;

  const filteredBoxes = scopedBoxes.filter((b) =>
    b.name.toLowerCase().includes(boxQ.toLowerCase()) ||
    (b.description ?? "").toLowerCase().includes(boxQ.toLowerCase())
  );

  const filteredOrders = recentOrders.filter((o) => {
    const q = orderQ.toLowerCase();
    return (
      o.user.name.toLowerCase().includes(q) ||
      o.pickupCode.toLowerCase().includes(q) ||
      (o.items[0]?.box.name ?? "").toLowerCase().includes(q) ||
      STATUS_LABEL[o.status].toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* ── Boxes ── */}
      <section id="boxes" style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--cream)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Box</h2>

          {/* scope toggle */}
          <div style={{ display: "flex", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0 }}>
            {(["today", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setBoxScope(s)}
                style={{
                  padding: "5px 12px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                  background: boxScope === s ? "var(--primary)" : "white",
                  color: boxScope === s ? "white" : "var(--text-muted)",
                }}
              >
                {s === "today" ? "Hôm nay" : "Tất cả"}
              </button>
            ))}
          </div>

          <input
            value={boxQ} onChange={(e) => setBoxQ(e.target.value)}
            placeholder="Tìm box..."
            style={{ padding: "6px 12px", fontSize: 13, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", width: 180 }}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", marginLeft: "auto" }}>
            {filteredBoxes.length}/{scopedBoxes.length} box
          </span>
        </div>

        {scopedBoxes.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Chưa có box nào hôm nay</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Tạo box để bắt đầu bán hàng.</p>
            <CreateBoxModal storeAddress={storeAddress} />
          </div>
        ) : filteredBoxes.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Không tìm thấy box nào khớp với &ldquo;{boxQ}&rdquo;
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--ivory)" }}>
                {["Ngày", "Tên box", "Giá gốc", "Giá bán", "Còn lại", "Giờ nhận", "Trạng thái", "", ""].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBoxes.map((b) => {
                const isToday = new Date(b.date).toISOString().slice(0, 10) === todayStr;
                const sold    = b.quantityTotal - b.quantityLeft;
                const pct     = b.quantityTotal > 0 ? Math.round((sold / b.quantityTotal) * 100) : 0;
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid var(--cream)", opacity: b.active ? 1 : 0.5 }}>
                    <td style={{ ...td, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {isToday
                        ? <span style={{ fontWeight: 700, color: "var(--primary)" }}>Hôm nay</span>
                        : new Date(new Date(b.date).getTime() + 7 * 60 * 60_000).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
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
                        background: !isToday
                          ? (b.active ? "var(--primary-soft)" : "#fef9f0")
                          : (b.active && b.quantityLeft > 0 ? "var(--primary-soft)" : b.quantityLeft === 0 ? "#f1f5f9" : "#fef9f0"),
                        color: !isToday
                          ? (b.active ? "var(--primary-dark)" : "var(--accent)")
                          : (b.active && b.quantityLeft > 0 ? "var(--primary-dark)" : b.quantityLeft === 0 ? "#64748b" : "var(--accent)"),
                      }}>
                        {!isToday
                          ? (b.active ? "Đã lên lịch" : "Tạm dừng")
                          : (b.quantityLeft === 0 ? "Hết hàng" : b.active ? "Đang bán" : "Tạm dừng")}
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

      {editBox && <EditBoxModal box={editBox} onClose={() => setEditBox(null)} />}

      {/* ── Orders ── */}
      <section id="orders" style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--cream)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginRight: "auto" }}>Đơn hàng gần đây</h2>
          <input
            value={orderQ} onChange={(e) => setOrderQ(e.target.value)}
            placeholder="Tìm theo tên, mã đơn, trạng thái..."
            style={{ padding: "6px 12px", fontSize: 13, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", width: 240 }}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {filteredOrders.length}/{totalOrders} đơn
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Chưa có đơn hàng nào
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Không tìm thấy đơn nào khớp với &ldquo;{orderQ}&rdquo;
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--ivory)" }}>
                {["Mã đơn", "Khách hàng", "Box", "Tổng tiền", "Thời gian", "Trạng thái", "Thao tác"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} style={{ borderTop: "1px solid var(--cream)" }}>
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
                    <PartnerOrderActions orderId={o.id} status={o.status as "PENDING" | "CONFIRMED" | "PICKED_UP" | "CANCELLED"} />
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
