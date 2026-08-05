"use client";

import { useState } from "react";

type HistoryOrder = {
  id: string;
  total: number;
  status: string;
  pickupCode: string;
  createdAt: Date | string;
  pickedUpAt: Date | string | null;
  user: { name: string };
  items: { quantity: number; box: { name: string } }[];
};

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "13px 20px", fontSize: 15, color: "var(--text)" };

function fmtVN(date: Date | string) {
  const d = new Date(new Date(date).getTime() + 7 * 60 * 60_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function StatusNote({ order }: { order: HistoryOrder }) {
  if (order.status === "PICKED_UP") {
    return (
      <div>
        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
          Đã nhận hàng
        </span>
        {order.pickedUpAt && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            lúc {fmtVN(order.pickedUpAt)}
          </div>
        )}
      </div>
    );
  }
  if (order.status === "CANCELLED") {
    return (
      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>
        Đã hủy
      </span>
    );
  }
  if (order.status === "CONFIRMED") {
    return (
      <div>
        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>
          Hết hạn
        </span>
        <div style={{ fontSize: 11, color: "#92400e", marginTop: 4, fontWeight: 600 }}>
          Đã xác nhận — khách chưa nhận
        </div>
      </div>
    );
  }
  // PENDING expired
  return (
    <div>
      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>
        Hết hạn
      </span>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 600 }}>
        Chưa được xác nhận
      </div>
    </div>
  );
}

export default function OrderHistoryTab({ orders }: { orders: HistoryOrder[] }) {
  const [q, setQ] = useState("");

  const filtered = orders.filter((o) => {
    const s = q.toLowerCase();
    return (
      o.user.name.toLowerCase().includes(s) ||
      o.pickupCode.toLowerCase().includes(s) ||
      (o.items[0]?.box.name ?? "").toLowerCase().includes(s) ||
      o.status.toLowerCase().includes(s)
    );
  });

  return (
    <section style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--cream)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginRight: "auto" }}>Tất cả đơn</h2>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, mã đơn, box..."
          style={{ padding: "6px 12px", fontSize: 15, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", width: 240 }}
        />
        <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {filtered.length}/{orders.length} đơn
        </span>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
          Chưa có đơn hàng nào trong lịch sử
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
          Không tìm thấy đơn nào khớp với &ldquo;{q}&rdquo;
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--ivory)" }}>
              {["Mã đơn", "Khách hàng", "Box", "Tổng tiền", "Đặt lúc", "Trạng thái"].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid var(--cream)" }}>
                <td style={td}>
                  <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: 12 }}>
                    #{o.pickupCode.slice(0, 8).toUpperCase()}
                  </div>
                </td>
                <td style={{ ...td, fontWeight: 600 }}>{o.user.name}</td>
                <td style={{ ...td, fontSize: 12, color: "var(--text-muted)" }}>
                  {o.items[0]?.box.name ?? "—"}
                  {o.items[0]?.quantity > 1 && (
                    <span style={{ marginLeft: 4, fontWeight: 700 }}>× {o.items[0].quantity}</span>
                  )}
                </td>
                <td style={{ ...td, fontWeight: 700 }}>{o.total.toLocaleString("vi-VN")}đ</td>
                <td style={{ ...td, fontSize: 12, color: "var(--text-muted)" }}>
                  {fmtVN(o.createdAt)}
                </td>
                <td style={td}>
                  <StatusNote order={o} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
