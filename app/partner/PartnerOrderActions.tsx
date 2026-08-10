"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "PENDING" | "CONFIRMED" | "PICKED_UP" | "CANCELLED";

const NEXT: Partial<Record<Status, { label: string; next: string; style: React.CSSProperties }[]>> = {
  PENDING: [
    { label: "Xác nhận", next: "CONFIRMED", style: { background: "var(--primary)", color: "white" } },
    { label: "Hủy", next: "CANCELLED", style: { border: "1px solid #fca5a5", color: "#ef4444", background: "white" } },
  ],
  CONFIRMED: [
    { label: "Đã nhận hàng", next: "PICKED_UP", style: { background: "#38bdf8", color: "white" } },
    { label: "Hủy", next: "CANCELLED", style: { border: "1px solid #fca5a5", color: "#ef4444", background: "white" } },
  ],
};

export default function PartnerOrderActions({ orderId, status }: { orderId: string; status: Status }) {
  const router  = useRouter();
  const [busy, setBusy] = useState(false);
  const actions = NEXT[status];
  if (!actions) return null;

  async function act(next: string) {
    setBusy(true);
    await fetch(`/api/partner/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {actions.map((a) => (
        <button key={a.next} onClick={() => act(a.next)} disabled={busy}
          style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", border: "none", opacity: busy ? 0.6 : 1, ...a.style }}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

