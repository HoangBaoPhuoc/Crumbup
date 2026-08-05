import { dealBadge, formatVNDate } from "@/lib/utils";

type Claim = {
  id: string;
  code: string;
  status: string;
  claimedAt: Date | string;
  promotion: {
    title: string;
    dealType: string | null;
    discountValue: number | null;
    validUntil: Date | string;
    store: { name: string; address: string };
  };
};

const STATUS_LABEL: Record<string, string> = {
  CLAIMED:  "Chưa dùng",
  REDEEMED: "Đã dùng",
  EXPIRED:  "Hết hạn",
};
const STATUS_COLOR: Record<string, React.CSSProperties> = {
  CLAIMED:  { background: "var(--primary-soft)", color: "var(--primary-dark)" },
  REDEEMED: { background: "#f1f5f9", color: "#64748b" },
  EXPIRED:  { background: "#fef3c7", color: "#92400e" },
};

export default function VoucherClaimCard({ claim }: { claim: Claim }) {
  const expired = claim.status === "CLAIMED" && new Date() > new Date(claim.promotion.validUntil);
  const status  = expired ? "EXPIRED" : claim.status;

  return (
    <div style={{
      background: "white", borderRadius: 14, border: "1px solid var(--border)",
      padding: "16px 18px", display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{claim.promotion.title}</span>
          {dealBadge(claim.promotion.dealType, claim.promotion.discountValue) && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
              {dealBadge(claim.promotion.dealType, claim.promotion.discountValue)}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {claim.promotion.store.name} · {claim.promotion.store.address}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          Hiệu lực đến {formatVNDate(new Date(claim.promotion.validUntil))}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: 20, fontWeight: 800, letterSpacing: "0.08em", fontFamily: "monospace",
          color: status === "CLAIMED" ? "var(--primary)" : "var(--text-muted)",
        }}>
          {claim.code}
        </div>
        <span style={{
          display: "inline-block", marginTop: 6, padding: "3px 10px", borderRadius: 999,
          fontSize: 11, fontWeight: 700, ...STATUS_COLOR[status],
        }}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  );
}
