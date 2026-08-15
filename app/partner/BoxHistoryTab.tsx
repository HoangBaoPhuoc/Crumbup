"use client";

import { useMemo, useState } from "react";
import RepostBoxModal from "./RepostBoxModal";
import Pagination from "./Pagination";
import { TIME_FILTER_OPTIONS, timeFilterStart, type CategoryOption, type TimeFilter } from "@/lib/utils";

type Box = {
  id: string; name: string; description: string | null; image: string | null;
  categoryId: string; category: { id: string; label: string; emoji: string | null } | null;
  priceOriginal: number; priceSale: number;
  quantityTotal: number; quantityLeft: number;
  pickupStart: string; pickupEnd: string; active: boolean;
  date: Date | string;
};

const PAGE_SIZE = 10;

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "13px 20px", fontSize: 15, color: "var(--text)" };

export default function BoxHistoryTab({
  historyBoxes, storeAddress, categories,
}: {
  historyBoxes: Box[];
  storeAddress: string;
  categories:   CategoryOption[];
}) {
  const [repostBox, setRepostBox] = useState<Box | null>(null);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [page, setPage] = useState(1);
  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    const timeStart = timeFilter === "all" ? null : timeFilterStart(timeFilter, now);
    return historyBoxes.filter((b) => {
      const matchesQ = b.name.toLowerCase().includes(s) ||
        new Date(b.date).toLocaleDateString("vi-VN").includes(s);
      const matchesCategory = !categoryFilter || b.categoryId === categoryFilter;
      const matchesTime = !timeStart || new Date(b.date) >= timeStart;
      return matchesQ && matchesCategory && matchesTime;
    });
  }, [historyBoxes, q, categoryFilter, timeFilter, now]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter(setter: () => void) {
    setter();
    setPage(1);
  }

  return (
    <>
      <section style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--cream)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginRight: "auto" }}>Lịch sử box</h2>
          <input
            value={q} onChange={(e) => updateFilter(() => setQ(e.target.value))}
            placeholder="Tìm tên box, ngày..."
            style={{ padding: "6px 12px", fontSize: 15, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", width: 200 }}
          />
          <select value={categoryFilter} onChange={(e) => updateFilter(() => setCategoryFilter(e.target.value))}
            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", cursor: "pointer" }}>
            <option value="">Tất cả ngành hàng</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
          <select value={timeFilter} onChange={(e) => updateFilter(() => setTimeFilter(e.target.value as TimeFilter))}
            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", outline: "none", background: "var(--ivory)", cursor: "pointer" }}>
            {TIME_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {filtered.length}/{historyBoxes.length} box
          </span>
        </div>

        {historyBoxes.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
            Chưa có box nào trong lịch sử
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
            Không tìm thấy box khớp với bộ lọc
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                {["Ngày", "Tên box", "Giá bán", "Đã bán", "Doanh thu", ""].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((b, idx) => {
                const sold    = b.quantityTotal - b.quantityLeft;
                const revenue = sold * b.priceSale;
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid var(--border)", background: idx % 2 === 1 ? "var(--cream)" : "white", opacity: 0.85 }}>
                    <td style={{ ...td, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(b.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
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

        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
      </section>

      {repostBox && (
        <RepostBoxModal
          box={repostBox}
          storeAddress={storeAddress}
          categories={categories}
          onClose={() => setRepostBox(null)}
        />
      )}
    </>
  );
}
