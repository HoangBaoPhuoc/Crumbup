"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useDiscoverNav } from "./DiscoverNavContext";

export default function BoxPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useDiscoverNav();

  function goTo(next: number) {
    const p = new URLSearchParams(params.toString());
    if (next <= 1) p.delete("page");
    else p.set("page", String(next));
    navigate(`${pathname}?${p.toString()}`);
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
      padding: "24px 0 8px", opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s ease",
    }}>
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        style={{
          padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
          border: "1px solid var(--border)", background: "white",
          color: page <= 1 ? "#c9bba9" : "var(--text)",
          cursor: page <= 1 ? "not-allowed" : "pointer",
        }}
      >
        ‹ Trước
      </button>
      <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
        Trang {page}/{totalPages}
      </span>
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        style={{
          padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
          border: "1px solid var(--border)", background: "white",
          color: page >= totalPages ? "#c9bba9" : "var(--text)",
          cursor: page >= totalPages ? "not-allowed" : "pointer",
        }}
      >
        Sau ›
      </button>
    </div>
  );
}
