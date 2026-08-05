"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PendingActions({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router   = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function approve() {
    if (!confirm(`Duyệt cửa hàng "${storeName}"?`)) return;
    setLoading("approve");
    await fetch(`/api/admin/stores/${storeId}/approve`, { method: "POST" });
    router.refresh();
    setLoading(null);
  }

  async function reject() {
    if (!confirm(`Từ chối và xóa cửa hàng "${storeName}"? Tài khoản chủ sở hữu sẽ được giữ lại.`)) return;
    setLoading("reject");
    await fetch(`/api/admin/stores/${storeId}/reject`, { method: "POST" });
    router.refresh();
    setLoading(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
      <button
        onClick={approve}
        disabled={loading !== null}
        style={{
          padding: "9px 20px", borderRadius: 10, border: "none",
          background: loading === "approve" ? "#86efac" : "#b87c52",
          color: "white", fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", minWidth: 100,
        }}
      >
        {loading === "approve" ? "Đang xử lý..." : "Duyệt"}
      </button>
      <button
        onClick={reject}
        disabled={loading !== null}
        style={{
          padding: "9px 20px", borderRadius: 10,
          border: "1px solid #e5d5c8",
          background: "white",
          color: loading === "reject" ? "#c4a882" : "#78716c",
          fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", minWidth: 100,
        }}
      >
        {loading === "reject" ? "Đang xử lý..." : "Từ chối"}
      </button>
    </div>
  );
}
