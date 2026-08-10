"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  async function handleResetPassword() {
    setError("");
    if (!email.includes("@")) { setError("Email không hợp lệ"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      setError("Không thể gửi link khôi phục. Vui lòng thử lại.");
      return;
    }
    setSuccess(true);
    setResendCount((c) => c + 1);
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
        <Link href="/login" style={{ position: "absolute", top: 24, left: 28, display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Quay lại
        </Link>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 120, height: 80, borderRadius: 10, background: "#fff2f2ff", display: "grid", placeItems: "center", margin: "0 auto 24px", color: "var(--primary)", fontWeight: 800, fontSize: 30, letterSpacing: "1px" }}>
                <Countdown key={resendCount} initialSeconds={900} />
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Kiểm tra email của bạn</h1>
              <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 8 }}>
                Chúng tôi đã gửi link khôi phục mật khẩu đến
              </p>
              <p style={{ fontSize: 17, fontWeight: 700, color: "var(--primary)", marginBottom: 12 }}>{email}</p>
              
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 24 }}>
                Không nhận được email?{" "}
                <button 
                  onClick={handleResetPassword} 
                  disabled={loading}
                  style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", padding: 0 }}
                >
                  {loading ? "Đang gửi..." : "Gửi lại link mới"}
                </button>
              </div>
              {error && <div style={{ marginTop: 12 }}><ErrBox msg={error} /></div>}
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Quên mật khẩu?</h1>
              <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 36 }}>
                Nhập email của bạn và chúng tôi sẽ gửi link để đặt lại mật khẩu.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" value={email} placeholder="username@gmail.com"
                    onChange={(e) => setEmail(e.target.value)} style={inp}
                    onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()} />
                </div>

                {error && <ErrBox msg={error} />}

                <button onClick={handleResetPassword} disabled={loading}
                  style={{ width: "100%", padding: "13px", fontSize: 17, fontWeight: 700, borderRadius: 12, background: "var(--text)", color: "white", border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Đang gửi..." : "Gửi link khôi phục"}
                </button>
              </div>
            </>
          )}

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

function Countdown({ initialSeconds }: { initialSeconds: number }) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const router = useRouter();

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Link khôi phục đã hết hạn. Vui lòng yêu cầu lại.");
      router.push("/login");
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router]);

  const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");

  return <span>{m}:{s}</span>;
}
