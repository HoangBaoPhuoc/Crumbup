"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      title="Tải lại dữ liệu"
      aria-label="Tải lại dữ liệu"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        border: "1px solid var(--border)", background: "white",
        color: "var(--text-muted)", cursor: isPending ? "not-allowed" : "pointer",
        fontSize: 18, lineHeight: 1,
      }}
    >
      <span style={{
        display: "inline-block",
        animation: isPending ? "spin 0.7s linear infinite" : "none",
      }}>
        ⟳
      </span>
    </button>
  );
}
