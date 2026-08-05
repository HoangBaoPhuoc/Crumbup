"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPhonePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [phone, setPhone]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setChecking(false);
    });
  }, [router]);

  async function submit() {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) { setError("Số điện thoại không hợp lệ"); return; }

    setLoading(true);
    const res = await fetch("/api/auth/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-phone", phone }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) { setError(data.error); return; }
    router.push("/discover");
    router.refresh();
  }

  if (checking) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--primary-soft)", display: "grid", placeItems: "center", fontSize: 35, marginBottom: 20 }}>
          📱
        </div>
        <h1 style={{ fontSize: 25, fontWeight: 900, marginBottom: 8 }}>Thêm số điện thoại</h1>
        <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
          Chỉ còn một bước nữa. Chúng tôi cần số điện thoại để liên hệ khi có vấn đề với đơn hàng của bạn.
        </p>

        <label style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          Số điện thoại <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--cream)", fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
            🇻🇳 +84
          </div>
          <input
            type="tel"
            value={phone}
            placeholder="901 234 567"
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{ width: "100%", flex: 1, padding: "13px 16px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 16, outline: "none", background: "var(--ivory)", boxSizing: "border-box" }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: "11px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 15, color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{ width: "100%", padding: "14px", fontSize: 17, fontWeight: 700, borderRadius: 12, background: "var(--text)", color: "white", border: "none", cursor: "pointer", marginTop: 20, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Đang lưu..." : "Tiếp tục →"}
        </button>
      </div>
    </div>
  );
}
