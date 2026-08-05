"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(true);

  const [loading, setLoading]       = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);
  const [oauthError, setOauthError] = useState("");
  const [error, setError]           = useState("");
  const [forgotMsg, setForgotMsg]   = useState(false);

  async function signInWithGoogle() {
    setOauthError("");
    setOauthLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) {
      setOauthLoading(null);
      setOauthError("Không thể đăng nhập bằng Google. Vui lòng thử lại.");
    }
    // On success Supabase redirects the browser away to Google — nothing left to do here.
  }

  async function loginPassword() {
    setError("");
    if (!email.includes("@")) { setError("Email không hợp lệ"); return; }
    if (!password) { setError("Vui lòng nhập mật khẩu"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) { setError("Email hoặc mật khẩu không đúng"); return; }
    router.push(data.role === "BUSINESS" ? "/partner" : "/discover");
    router.refresh();
  }

  return (
    <div className="auth-layout" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "42% 1fr" }}>
      <BrandPanel />

      <div style={{ background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative" }}>
        <Link href="/" style={{ position: "absolute", top: 24, left: 28, display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Trang chủ
        </Link>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Đăng nhập</h1>
          <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 36 }}>
            Chưa có tài khoản?{" "}
            <Link href="/register" style={{ color: "var(--primary)", fontWeight: 700 }}>Đăng ký ngay</Link>
          </p>

          {/* Primary OAuth */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <OAuthBtn
              icon={<GoogleIcon />}
              label="Tiếp tục với Google"
              loading={oauthLoading === "google"}
              primary
              onClick={signInWithGoogle}
            />
          </div>
          {oauthError && <ErrBox msg={oauthError} />}
          {forgotMsg && <ComingSoonBox msg="Tính năng đang được phát triển, vui lòng liên hệ admin." />}

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>hoặc đăng nhập bằng email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Email + Password (collapsed by default) */}
          {showEmailForm && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={email} placeholder="ban@email.com"
                  onChange={(e) => setEmail(e.target.value)} style={inp}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  onKeyDown={(e) => e.key === "Enter" && loginPassword()} />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={lbl}>Mật khẩu</label>
                  <button type="button" onClick={() => { setForgotMsg(true); setTimeout(() => setForgotMsg(false), 3500); }}
                    style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Quên mật khẩu?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password} placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inp, paddingRight: 52 }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    onKeyDown={(e) => e.key === "Enter" && loginPassword()} />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    {showPw ? "ẩn" : "hiện"}
                  </button>
                </div>
              </div>

              {error && <ErrBox msg={error} />}

              <button onClick={loginPassword} disabled={loading}
                style={{ width: "100%", padding: "13px", fontSize: 17, fontWeight: 700, borderRadius: 12, background: "var(--text)", color: "white", border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

/* ── Brand Panel ── */
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
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 32 }}>Save Every Crumb</div>
        <p style={{ fontSize: 21, fontWeight: 700, color: "white", lineHeight: 1.4, maxWidth: 280, opacity: 0.9 }}>
          Cứu món ngon cuối ngày,<br />
          <em style={{ color: "var(--primary)", fontStyle: "italic" }}>tiết kiệm mỗi tối.</em>
        </p>
      </div>
      <p style={{ position: "absolute", bottom: 28, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>© 2026 CrumbUp</p>
    </div>
  );
}

/* ── OAuth Button ── */
function OAuthBtn({ icon, label, loading, primary = false, onClick }: {
  icon: React.ReactNode; label: string; loading: boolean; primary?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", padding: "13px 16px", borderRadius: 12,
      border: primary ? "none" : "1.5px solid var(--border)",
      background: primary ? "var(--text)" : "white",
      display: "flex", alignItems: "center", gap: 12,
      fontSize: 16, fontWeight: 700,
      color: primary ? "white" : "var(--text)",
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.7 : 1,
      transition: "opacity 0.15s",
      boxShadow: primary ? "0 2px 12px rgba(0,0,0,0.15)" : "none",
    }}>
      <span style={{ width: 24, height: 24, flexShrink: 0, display: "grid", placeItems: "center" }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "center" }}>{loading ? "Đang chuyển..." : label}</span>
    </button>
  );
}

/* ── SVG Icons ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Micro ── */
function ComingSoonBox({ msg }: { msg: string }) {
  return (
    <div style={{ marginTop: 12, padding: "11px 14px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, fontSize: 15, color: "#92400e" }}>
      {msg}
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "11px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 15, color: "var(--danger)" }}>
      {msg}
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 15, fontWeight: 700, marginBottom: 8 };
const inp: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 16, outline: "none", background: "var(--ivory)", transition: "border-color 0.2s", boxSizing: "border-box" };
