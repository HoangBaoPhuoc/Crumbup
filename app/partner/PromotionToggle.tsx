"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PromotionToggle({ promotionId, active }: { promotionId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/partner/promotions/${promotionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={busy} style={{
      padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
      cursor: busy ? "not-allowed" : "pointer", border: "none",
      background: active ? "#fef3c7" : "#dcfce7",
      color: active ? "#92400e" : "#15803d",
      opacity: busy ? 0.6 : 1,
    }}>
      {busy ? "..." : active ? "Tắt" : "Bật"}
    </button>
  );
}
