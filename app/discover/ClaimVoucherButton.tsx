"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimVoucherButton({ promotionId, isLoggedIn }: { promotionId: string; isLoggedIn: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [code, setCode]       = useState<string | null>(null);
  const [error, setError]     = useState("");

  async function claim() {
    if (!isLoggedIn) { router.push("/login"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/promotions/${promotionId}/claim`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.code) { setCode(data.code); return; }
      setError(data.error ?? "Lỗi lấy mã");
      return;
    }
    setCode(data.code);
  }

  if (code) {
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Mã của bạn</div>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.08em", color: "var(--primary)", fontFamily: "monospace" }}>
          {code}
        </div>
        <a href="/orders" style={{ fontSize: 11, color: "var(--primary)", textDecoration: "underline" }}>
          Xem trong &ldquo;Ưu đãi của tôi&rdquo;
        </a>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "right" }}>
      <button onClick={claim} disabled={loading} className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
        {loading ? "Đang lấy..." : "Lấy mã"}
      </button>
      {error && <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 4, maxWidth: 160 }}>{error}</div>}
    </div>
  );
}
