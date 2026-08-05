"use client";

import { useState } from "react";
import CreatePromotionModal from "./CreatePromotionModal";
import EditPromotionModal from "./EditPromotionModal";
import PromotionToggle from "./PromotionToggle";
import RedeemCodeWidget from "./RedeemCodeWidget";
import { dealBadge, promotionKindLabel, promotionKindEmoji } from "@/lib/utils";

type Promotion = {
  id: string; kind: string; title: string; description: string | null; image: string | null;
  dealType: string | null; discountValue: number | null;
  validFrom: Date | string; validUntil: Date | string;
  totalCodes: number | null; claimedCount: number; active: boolean;
  claims: { status: string }[];
};

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "13px 20px", fontSize: 15, color: "var(--text)" };

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PromotionsTab({ promotions }: { promotions: Promotion[] }) {
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const now = new Date();

  return (
    <>
      <RedeemCodeWidget />

      <section style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--cream)", display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginRight: "auto" }}>Chương trình khuyến mãi</h2>
          <CreatePromotionModal />
        </div>

        {promotions.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
            Chưa có chương trình khuyến mãi nào
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--ivory)" }}>
                {["Loại", "Tên chương trình", "Ưu đãi", "Hiệu lực", "Thống kê", "Trạng thái", "", ""].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => {
                const expired = now > new Date(p.validUntil);
                const redeemedCount = p.claims.filter((c) => c.status === "REDEEMED").length;
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--cream)", opacity: p.active ? 1 : 0.5 }}>
                    <td style={td}>
                      <span style={{
                        padding: "1px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                        background: p.kind === "PLATFORM_VOUCHER" ? "#ede9fe" : "#e0f2fe",
                        color: p.kind === "PLATFORM_VOUCHER" ? "#6d28d9" : "#0369a1",
                      }}>
                        {promotionKindEmoji(p.kind)} {promotionKindLabel(p.kind)}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      {p.description && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.description}</div>}
                    </td>
                    <td style={td}>
                      {dealBadge(p.dealType, p.discountValue) ?? "—"}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(p.validFrom)} – {fmtDate(p.validUntil)}
                    </td>
                    <td style={{ ...td, fontSize: 12 }}>
                      {p.kind === "PLATFORM_VOUCHER"
                        ? <>Đã lấy {p.claimedCount}{p.totalCodes != null ? `/${p.totalCodes}` : ""} · Đã dùng {redeemedCount}</>
                        : "—"}
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: expired ? "#f1f5f9" : p.active ? "var(--primary-soft)" : "#fef9f0",
                        color: expired ? "#64748b" : p.active ? "var(--primary-dark)" : "var(--accent)",
                      }}>
                        {expired ? "Hết hạn" : p.active ? "Đang chạy" : "Tạm dừng"}
                      </span>
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => setEditPromo(p)}
                        style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--ivory)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", whiteSpace: "nowrap" }}
                      >
                        Sửa
                      </button>
                    </td>
                    <td style={td}><PromotionToggle promotionId={p.id} active={p.active} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {editPromo && <EditPromotionModal promotion={editPromo} onClose={() => setEditPromo(null)} />}
    </>
  );
}
