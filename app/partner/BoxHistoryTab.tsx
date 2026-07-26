"use client";

import { useState } from "react";
import RepostBoxModal from "./RepostBoxModal";
import { productTypeLabel, productTypeEmoji } from "@/lib/utils";

type Box = {
  id: string; name: string; description: string | null; image: string | null;
  category: string; productType: string;
  priceOriginal: number; priceSale: number;
  quantityTotal: number; quantityLeft: number;
  pickupStart: string; pickupEnd: string; active: boolean;
  date: Date | string;
};

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "13px 20px", fontSize: 13, color: "var(--text)" };

export default function BoxHistoryTab({
  historyBoxes, storeAddress,
}: {
  historyBoxes: Box[];
  storeAddress: string;
}) {
  const [repostBox, setRepostBox] = useState<Box | null>(null);
  const [q, setQ] = useState("");

  const filtered = historyBoxes.filter((b) => {
    const s = q.toLowerCase();
    return b.name.toLowerCase().includes(s) ||
      new Date(b.date).toLocaleDateString("vi-VN").includes(s);
  });

  return (
    <>
      <section style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--cream)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginRight: "auto" }}>Lịch sử box</h2>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên box, ngày..."
            style={{ padding: "6px 12px", fontSize: 13, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", width: 200 }}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {filtered.length}/{historyBoxes.length} box
          </span>
        </div>

        {historyBoxes.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Chưa có box nào trong lịch sử
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Không tìm thấy box khớp với &ldquo;{q}&rdquo;
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--ivory)" }}>
                {["Ngày", "Tên box", "Giá bán", "Đã bán", "Doanh thu", ""].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const sold    = b.quantityTotal - b.quantityLeft;
                const revenue = sold * b.priceSale;
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid var(--cream)", opacity: 0.8 }}>
                    <td style={{ ...td, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(b.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          padding: "1px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                          background: b.productType === "VOUCHER" ? "#ede9fe" : "var(--primary-soft)",
                          color: b.productType === "VOUCHER" ? "#6d28d9" : "var(--primary-dark)",
                        }}>
                          {productTypeEmoji(b.productType)} {productTypeLabel(b.productType)}
                        </span>
                        <div style={{ fontWeight: 600 }}>{b.name}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.pickupStart} – {b.pickupEnd}</div>
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: "var(--primary)" }}>
                      {b.priceSale.toLocaleString("vi-VN")}đ
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{sold}/{b.quantityTotal}</div>
                      <div style={{ marginTop: 4, height: 4, background: "var(--cream)", borderRadius: 999, width: 60 }}>
                        <div style={{ height: "100%", width: `${b.quantityTotal > 0 ? Math.round((sold / b.quantityTotal) * 100) : 0}%`, background: "var(--accent)", borderRadius: 999 }} />
                      </div>
                    </td>
                    <td style={{ ...td, fontWeight: 700 }}>
                      {revenue.toLocaleString("vi-VN")}đ
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => setRepostBox(b)}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: "var(--primary-soft)", color: "var(--primary)",
                          border: "1px solid var(--primary-soft)", cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Đăng lại
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {repostBox && (
        <RepostBoxModal
          box={repostBox}
          storeAddress={storeAddress}
          onClose={() => setRepostBox(null)}
        />
      )}
    </>
  );
}
