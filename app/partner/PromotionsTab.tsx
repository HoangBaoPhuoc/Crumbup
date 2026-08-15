"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import CreatePromotionModal from "./CreatePromotionModal";
import EditPromotionModal from "./EditPromotionModal";
import PromotionToggle from "./PromotionToggle";
import RedeemCodeWidget from "./RedeemCodeWidget";
import { dealBadge } from "@/lib/utils";

type Claim = {
  code: string; status: string;
  claimedAt: Date | string; redeemedAt: Date | string | null;
  user: { name: string; phone: string | null };
};

type Promotion = {
  id: string; kind: string; title: string; description: string | null; image: string | null;
  dealType: string | null; discountValue: number | null;
  validFrom: Date | string; validUntil: Date | string;
  totalCodes: number | null; claimedCount: number; active: boolean; createdAt: Date | string;
  claims: Claim[];
};

type StatusFilter = "all" | "scheduled" | "active" | "paused" | "expired";

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "Tất cả trạng thái" },
  { value: "scheduled", label: "Đã lên lịch" },
  { value: "active",    label: "Đang chạy" },
  { value: "paused",    label: "Tạm dừng" },
  { value: "expired",   label: "Hết hạn" },
];

const PROMO_STATUS_LABEL: Record<Exclude<StatusFilter, "all">, string> = {
  scheduled: "Đã lên lịch",
  active:    "Đang chạy",
  paused:    "Tạm dừng",
  expired:   "Hết hạn",
};
const PROMO_STATUS_COLOR: Record<Exclude<StatusFilter, "all">, React.CSSProperties> = {
  scheduled: { background: "var(--blue)", color: "var(--blue-strong)" },
  active:    { background: "var(--primary-soft)", color: "var(--primary-dark)" },
  paused:    { background: "#fef3c7", color: "#92400e" },
  expired:   { background: "#f1f5f9", color: "#64748b" },
};

type TimeFilter = "all" | "today" | "week" | "month";

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all",   label: "Mọi thời điểm" },
  { value: "today", label: "Tạo hôm nay" },
  { value: "week",  label: "Tạo tuần này" },
  { value: "month", label: "Tạo tháng này" },
];

/** Start of the filter window (local time) for "today" / "week" (Mon-based) / "month". */
function timeFilterStart(filter: Exclude<TimeFilter, "all">, now: Date): Date {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (filter === "today") return startOfDay;
  if (filter === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return new Date(startOfDay.getFullYear(), startOfDay.getMonth(), startOfDay.getDate() + diffToMonday);
}

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "13px 20px", fontSize: 15, color: "var(--text)" };

const CLAIM_STATUS_LABEL: Record<string, string> = {
  CLAIMED:  "Đã lấy",
  REDEEMED: "Đã dùng",
  EXPIRED:  "Hết hạn",
};
const CLAIM_STATUS_COLOR: Record<string, React.CSSProperties> = {
  CLAIMED:  { background: "#fef3c7", color: "#92400e" },
  REDEEMED: { background: "#dcfce7", color: "#15803d" },
  EXPIRED:  { background: "#f1f5f9", color: "#64748b" },
};

type ClaimStatusFilter = "all" | "CLAIMED" | "REDEEMED" | "EXPIRED";

const CLAIM_STATUS_FILTER_OPTIONS: { value: ClaimStatusFilter; label: string }[] = [
  { value: "all",      label: "Tất cả trạng thái" },
  { value: "CLAIMED",  label: "Đã lấy" },
  { value: "REDEEMED", label: "Đã dùng" },
  { value: "EXPIRED",  label: "Hết hạn" },
];

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function promotionStatus(p: Promotion, now: Date): Exclude<StatusFilter, "all"> {
  if (now > new Date(p.validUntil)) return "expired";
  if (now < new Date(p.validFrom)) return "scheduled";
  return p.active ? "active" : "paused";
}

/** Live-ticking "starts in ..." label for scheduled promotions. */
function CountdownText({ target }: { target: Date }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const text = days > 0
    ? `Bắt đầu sau ${days} ngày ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `Bắt đầu sau ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return <div style={{ fontSize: 10, fontWeight: 600, color: "var(--blue-strong)", marginTop: 3, whiteSpace: "nowrap" }}>{text}</div>;
}

export default function PromotionsTab({ promotions }: { promotions: Promotion[] }) {
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const now = new Date();

  const vouchers      = promotions.filter((p) => p.kind === "PLATFORM_VOUCHER");
  const announcements = promotions.filter((p) => p.kind === "STORE_ANNOUNCEMENT");

  return (
    <>
      <RedeemCodeWidget />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <CreatePromotionModal />
      </div>

      <PromotionTable
        title="Mã khuyến mãi nền tảng"
        emptyText="Chưa có mã khuyến mãi nền tảng nào"
        noMatchText="Không có chương trình nào khớp với bộ lọc"
        promotions={vouchers}
        showCodes
        now={now}
        onEdit={setEditPromo}
      />

      <div style={{ height: 24 }} />

      <PromotionTable
        title="Quảng cáo chương trình tại cửa hàng"
        emptyText="Chưa có quảng cáo chương trình nào"
        noMatchText="Không có quảng cáo nào khớp với bộ lọc"
        promotions={announcements}
        showCodes={false}
        now={now}
        onEdit={setEditPromo}
      />

      {editPromo && <EditPromotionModal promotion={editPromo} onClose={() => setEditPromo(null)} />}
    </>
  );
}

function PromotionTable({
  title, emptyText, noMatchText, promotions, showCodes, now, onEdit,
}: {
  title: string; emptyText: string; noMatchText: string; promotions: Promotion[]; showCodes: boolean;
  now: Date; onEdit: (p: Promotion) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const columnCount = showCodes ? 7 : 6;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const timeStart = timeFilter === "all" ? null : timeFilterStart(timeFilter, now);
    return promotions.filter((p) => {
      const matchesStatus = statusFilter === "all" || promotionStatus(p, now) === statusFilter;
      const matchesTime = !timeStart || new Date(p.createdAt) >= timeStart;
      const matchesSearch = !q
        || p.title.toLowerCase().includes(q)
        || (p.description ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesTime && matchesSearch;
    });
  }, [promotions, search, statusFilter, timeFilter, now]);

  return (
    <section style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      <div style={{
        padding: "16px 22px", borderBottom: "1px solid var(--cream)",
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{title}</h2>
          <span style={{
            padding: "1px 9px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            background: "var(--ivory)", border: "1px solid var(--border)", color: "var(--text-muted)",
          }}>
            {promotions.length}
          </span>
        </div>

        {promotions.length > 0 && (
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên chương trình..."
              style={{
                flex: "1 1 220px", minWidth: 180, maxWidth: 280, padding: "8px 12px", borderRadius: 9,
                border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "var(--ivory)", color: "var(--text)",
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{
                padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)",
                fontSize: 13, outline: "none", background: "var(--ivory)", color: "var(--text)", cursor: "pointer",
              }}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              style={{
                padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)",
                fontSize: 13, outline: "none", background: "var(--ivory)", color: "var(--text)", cursor: "pointer",
              }}
            >
              {TIME_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {promotions.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
          {emptyText}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
          {noMatchText}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
              {[
                "Tên chương trình", "Ưu đãi", "Hiệu lực",
                ...(showCodes ? ["Thống kê"] : []),
                "Trạng thái", "", "",
              ].map((h, i) => (
                <th key={i} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => {
              const status = promotionStatus(p, now);
              const redeemedCount = p.claims.filter((c) => c.status === "REDEEMED").length;
              return (
                <Fragment key={p.id}>
                  <tr style={{
                    borderTop: "1px solid var(--border)",
                    background: idx % 2 === 1 ? "var(--cream)" : "white",
                    opacity: p.active ? 1 : 0.5,
                  }}>
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
                    {showCodes && (
                      <td style={{ ...td, fontSize: 12 }}>
                        Đã lấy {p.claimedCount}{p.totalCodes != null ? `/${p.totalCodes}` : ""} · Đã dùng {redeemedCount}
                      </td>
                    )}
                    <td style={td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        ...PROMO_STATUS_COLOR[status],
                      }}>
                        {PROMO_STATUS_LABEL[status]}
                      </span>
                      {status === "scheduled" && <CountdownText target={new Date(p.validFrom)} />}
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => onEdit(p)}
                        style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--ivory)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", whiteSpace: "nowrap" }}
                      >
                        Sửa
                      </button>
                    </td>
                    <td style={td}><PromotionToggle promotionId={p.id} active={p.active} /></td>
                  </tr>
                  {showCodes && p.totalCodes != null && (
                    <tr style={{ borderTop: "1px solid var(--border)" }}>
                      <td colSpan={columnCount} style={{ padding: "0 20px 18px", background: "white" }}>
                        <CodesList claims={p.claims} totalCodes={p.totalCodes} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

function CodesList({ claims, totalCodes }: { claims: Claim[]; totalCodes: number }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesSearch = !q
        || c.code.toLowerCase().includes(q)
        || c.user.name.toLowerCase().includes(q)
        || (c.user.phone ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [claims, search, statusFilter]);

  return (
    <div style={{ marginLeft: 24, paddingLeft: 18, paddingTop: 12, borderLeft: "2px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "auto" }}>
          Danh sách mã ({claims.length}/{totalCodes})
        </div>
        {claims.length > 0 && (
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã, tên, SĐT..."
              style={{
                flex: "1 1 180px", minWidth: 160, maxWidth: 240, padding: "6px 10px", borderRadius: 8,
                border: "1px solid var(--border)", fontSize: 12, outline: "none", background: "white", color: "var(--text)",
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClaimStatusFilter)}
              style={{
                padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)",
                fontSize: 12, outline: "none", background: "white", color: "var(--text)", cursor: "pointer",
              }}
            >
              {CLAIM_STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {claims.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)", paddingBottom: 4 }}>
          Chưa có khách nào lấy mã
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)", paddingBottom: 4 }}>
          Không có mã nào khớp với bộ lọc
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                {["Mã", "Người lấy", "SĐT", "Trạng thái", "Ngày lấy", "Ngày dùng"].map((h, i) => (
                  <th key={i} style={{ ...th, padding: "8px 14px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.code} style={{ borderTop: "1px solid var(--border)", background: idx % 2 === 1 ? "var(--cream)" : "white" }}>
                  <td style={{ ...td, padding: "8px 14px", fontWeight: 700, letterSpacing: "0.05em" }}>{c.code}</td>
                  <td style={{ ...td, padding: "8px 14px" }}>{c.user.name}</td>
                  <td style={{ ...td, padding: "8px 14px", color: "var(--text-muted)" }}>{c.user.phone ?? "—"}</td>
                  <td style={{ ...td, padding: "8px 14px" }}>
                    <span style={{
                      padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      ...(CLAIM_STATUS_COLOR[c.status] ?? {}),
                    }}>
                      {CLAIM_STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td style={{ ...td, padding: "8px 14px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(c.claimedAt)}</td>
                  <td style={{ ...td, padding: "8px 14px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{c.redeemedAt ? fmtDateTime(c.redeemedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
