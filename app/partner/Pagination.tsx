export default function Pagination({
  page, totalPages, onChange,
}: {
  page: number; totalPages: number; onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      padding: "14px 20px", borderTop: "1px solid var(--cream)",
    }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="partner-pager-btn"
        style={{
          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: "1px solid var(--border)", background: "white",
          color: page <= 1 ? "#c9bba9" : "var(--text-muted)",
          cursor: page <= 1 ? "not-allowed" : "pointer",
        }}
      >
        ‹ Trước
      </button>
      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
        Trang {page}/{totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="partner-pager-btn"
        style={{
          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: "1px solid var(--border)", background: "white",
          color: page >= totalPages ? "#c9bba9" : "var(--text-muted)",
          cursor: page >= totalPages ? "not-allowed" : "pointer",
        }}
      >
        Sau ›
      </button>
    </div>
  );
}
