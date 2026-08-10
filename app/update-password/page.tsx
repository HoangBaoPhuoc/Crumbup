"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpdatePassword() {
    setError("");
    if (password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    
    if (error) {
      setError("Không thể cập nhật mật khẩu. Vui lòng thử lại.");
      return;
    }
    
    // Redirect to discover page on success
    router.push("/discover");
    router.refresh();
  }

  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1.5px solid var(--border)", fontSize: 16, outline: "none",
    transition: "border-color 0.2s", color: "var(--text)"
  };
  const lbl = { display: "block", fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 };

  return (
    <div className="auth-layout" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "42% 1fr" }}>
      <BrandPanel />

      <div style={{ background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Mật khẩu mới</h1>
          <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 36 }}>
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lbl}>Mật khẩu mới</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password} placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inp, paddingRight: 52 }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  {showPw ? "ẩn" : "hiện"}
                </button>
              </div>
            </div>

            {error && <ErrBox msg={error} />}

            <button onClick={handleUpdatePassword} disabled={loading}
              style={{ width: "100%", padding: "13px", fontSize: 17, fontWeight: 700, borderRadius: 12, background: "var(--text)", color: "white", border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Components ── */
function BrandPanel() {
  return (
    <div className="auth-brand-panel" style={{ background: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(232,119,34,0.12)" }} />
      <div style={{ position: "absolute", bottom: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(76,140,74,0.10)" }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: 28, overflow: "hidden", margin: "0 auto 28px", boxShadow: "0 8px 32px rgba(232,119,34,0.4)" }}>
            <img src="/crumbup-logo-tabweb.jpg" alt="CrumbUp" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 55, fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 14 }}>CrumbUp</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cream)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 32 }}>Save Every Crumb</div>
        <p style={{ fontSize: 21, fontWeight: 700, color: "white", lineHeight: 1.4, maxWidth: 340, opacity: 0.9 }}>
          Cứu món ngon cuối ngày,<br />
          <em style={{ color: "var(--cream)", fontStyle: "italic" }}>tiết kiệm mỗi tối.</em>
        </p>
      </div>
      <p style={{ position: "absolute", bottom: 28, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>© 2026 CrumbUp</p>
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "11px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 14, color: "#b91c1c" }}>
      {msg}
    </div>
  );
}
