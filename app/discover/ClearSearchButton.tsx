"use client";

import { useDiscoverNav } from "./DiscoverNavContext";

export default function ClearSearchButton({ q }: { q: string }) {
  const { navigate } = useDiscoverNav();
  return (
    <button
      onClick={() => navigate("/discover")}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 999,
        background: "var(--cream)", border: "1px solid var(--border)",
        fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
        cursor: "pointer",
      }}
    >
      <span>Kết quả cho &ldquo;{q}&rdquo;</span>
      <span style={{ fontSize: 16, color: "var(--text-muted)" }}>×</span>
    </button>
  );
}
