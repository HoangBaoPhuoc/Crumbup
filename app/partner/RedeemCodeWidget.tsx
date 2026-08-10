"use client";

import { useState } from "react";

export default function RedeemCodeWidget() {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; message: string } | null>(null);

  async function submit() {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/partner/promotions/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setResult({ ok: false, message: data.error ?? "Lỗi xác nhận mã" });
      return;
    }
    setResult({ ok: true, message: `Đã xác nhận "${data.promotionTitle}" cho ${data.customerName}` });
    setCode("");
  }

  return (
    <section style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: "18px 22px", marginBottom: 24 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Xác nhận mã khuyến mãi</h2>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
        Nhập mã khách hàng đưa ra tại quầy để đánh dấu mã đã sử dụng.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="VD: A7K2M9QX"
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)",
            fontSize: 16, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            outline: "none", background: "var(--ivory)",
          }}
        />
        <button onClick={submit} disabled={loading || !code.trim()} style={{
          padding: "10px 22px", borderRadius: 10,
          background: loading ? "var(--primary-soft)" : "var(--primary)",
          color: loading ? "var(--primary)" : "white",
          border: "none", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
        }}>
          {loading ? "Đang kiểm tra..." : "Xác nhận"}
        </button>
      </div>
      {result && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 10, fontSize: 15,
          background: result.ok ? "#e0f2fe" : "#fef2f2",
          border: `1px solid ${result.ok ? "#7dd3fc" : "#fecaca"}`,
          color: result.ok ? "#0369a1" : "#b91c1c",
        }}>
          {result.ok ? "✅ " : "⚠️ "}{result.message}
        </div>
      )}
    </section>
  );
}

