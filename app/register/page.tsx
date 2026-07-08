"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "form" | "sent" | "location";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("form");

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]       = useState("");
  const [showPw, setShowPw]     = useState(false);

  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);
  const [oauthError, setOauthError] = useState("");
  const [error, setError]       = useState("");
  const [comingSoon, setComingSoon] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "email-exists") {
      setOauthError("Gmail này đã được đăng ký rồi. Vui lòng đăng ký bằng Gmail khác hoặc đăng nhập.");
    }
  }, [searchParams]);

  async function signInWithGoogle() {
    setOauthError("");
    setOauthLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?intent=register` },
    });
    if (error) {
      setOauthLoading(null);
      setOauthError("Không thể đăng ký bằng Google. Vui lòng thử lại.");
    }
    // On success Supabase redirects the browser away to Google — nothing left to do here.
  }

  function facebookComingSoon() {
    setComingSoon(true);
    setTimeout(() => setComingSoon(false), 3500);
  }

  async function register() {
    setError("");
    if (!name.trim()) { setError("Vui lòng nhập tên của bạn"); return; }
    if (!email.includes("@")) { setError("Email không hợp lệ"); return; }
    if (password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) { setError("Số điện thoại không hợp lệ"); return; }

    const normalizedPhone = `+84${digits.startsWith("0") ? digits.slice(1) : digits}`;

    setLoading(true);
    const res = await fetch("/api/auth/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        name: name.trim(),
        email,
        password,
        phone: normalizedPhone,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) { setError(data.error); return; }

    if (data.needsConfirm) {
      setStep("sent");
    } else {
      setStep("location");
    }
  }

  function requestLocation() {
    if (!navigator.geolocation) { router.push("/discover"); return; }
    navigator.geolocation.getCurrentPosition(
      () => router.push("/discover"),
      () => router.push("/discover"),
    );
  }

  return (
    <div className="auth-layout" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "42% 1fr" }}>
      <BrandPanel />

      <div style={{ background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative" }}>
        <Link href="/" style={{ position: "absolute", top: 24, left: 28, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Trang chủ
        </Link>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* ── STEP: FORM ── */}
          {step === "form" && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Tạo tài khoản</h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
                Đã có tài khoản?{" "}
                <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>Đăng nhập</Link>
              </p>

              {/* OAuth */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                <OAuthBtn
                  icon={<GoogleIcon />} label="Đăng ký với Google"
                  loading={oauthLoading === "google"} primary
                  onClick={signInWithGoogle}
                />
                <OAuthBtn
                  icon={<FacebookIcon />} label="Đăng ký với Facebook"
                  loading={false}
                  onClick={facebookComingSoon}
                />
              </div>
              {oauthError && <ErrBox msg={oauthError} />}
              {comingSoon && <ComingSoonBox msg="Tính năng đang được phát triển, vui lòng đăng ký bằng email." />}

              <Divider label="hoặc đăng ký bằng email" />

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Name */}
                <div>
                  <label style={lbl}>Họ và tên <Req /></label>
                  <input type="text" value={name} placeholder="Nguyễn Văn A"
                    onChange={(e) => setName(e.target.value)} style={inp}
                    onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                </div>

                {/* Email */}
                <div>
                  <label style={lbl}>Email <Req /></label>
                  <input type="email" value={email} placeholder="ban@email.com"
                    onChange={(e) => setEmail(e.target.value)} style={inp}
                    onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                </div>

                {/* Password */}
                <div>
                  <label style={lbl}>Mật khẩu <Req /></label>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} value={password} placeholder="Ít nhất 6 ký tự"
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...inp, paddingRight: 52 }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      {showPw ? "ẩn" : "hiện"}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label style={lbl}>Số điện thoại <Req /></label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--cream)", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                      🇻🇳 +84
                    </div>
                    <input type="tel" value={phone} placeholder="901 234 567"
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      style={{ ...inp, flex: 1 }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                      onKeyDown={(e) => e.key === "Enter" && register()} />
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Dùng để liên hệ khi có vấn đề với đơn hàng</p>
                </div>
              </div>

              {error && <ErrBox msg={error} />}

              <button onClick={register} disabled={loading}
                style={{ ...btn, marginTop: 24, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Đang tạo tài khoản..." : "Đăng ký →"}
              </button>

              <p style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <Link href="/terms" style={{ color: "var(--primary)" }}>Điều khoản dịch vụ</Link>
                {" "}và{" "}
                <Link href="/about#faq" style={{ color: "var(--primary)" }}>Chính sách bảo mật</Link>
              </p>
            </>
          )}

          {/* ── STEP: EMAIL SENT ── */}
          {step === "sent" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--primary-soft)", display: "grid", placeItems: "center", fontSize: 36, margin: "0 auto 24px" }}>
                ✉️
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Kiểm tra email của bạn</h1>
              <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 8 }}>
                Chúng tôi đã gửi link xác nhận đến
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 28 }}>{email}</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 32 }}>
                Nhấn vào link trong email để kích hoạt tài khoản. Kiểm tra cả thư mục <strong>Spam</strong> nếu không thấy.
              </p>
              <Link href="/login"
                style={{ display: "block", width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, borderRadius: 12, background: "var(--text)", color: "white", textDecoration: "none", textAlign: "center" }}>
                Về trang đăng nhập
              </Link>
            </div>
          )}

          {/* ── STEP: LOCATION ── */}
          {step === "location" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--accent-soft)", display: "grid", placeItems: "center", fontSize: 36, margin: "0 auto 24px" }}>
                📍
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Cho phép vị trí?</h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto 28px" }}>
                Chúng tôi sẽ hiện các Surprise Box gần bạn nhất — tươi, nhanh, đúng tầm tay.
              </p>

              <div style={{ background: "var(--cream)", borderRadius: 16, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
                {[
                  "Box từ các tiệm gần nhà",
                  "Thời gian nhận hàng ngắn nhất",
                  "Vị trí chỉ dùng trong app, không chia sẻ",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13, fontWeight: 500 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 999, background: "var(--primary)", flexShrink: 0 }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <button onClick={requestLocation} style={{ ...btn, marginBottom: 12 }}>
                Cho phép vị trí
              </button>
              <button onClick={() => router.push("/discover")}
                style={{ width: "100%", padding: "13px", fontSize: 14, fontWeight: 600, borderRadius: 12, background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", cursor: "pointer" }}>
                Bỏ qua
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="auth-brand-panel" style={{ background: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(232,119,34,0.12)" }} />
      <div style={{ position: "absolute", bottom: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(76,140,74,0.10)" }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, overflow: "hidden", margin: "0 auto 22px", boxShadow: "0 8px 32px rgba(232,119,34,0.4)" }}>
            <img src="/crumbup-logo-tabweb.jpg" alt="CrumbUp" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 900, color: "white", letterSpacing: "-0.03em", marginBottom: 8 }}>CrumbUp</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 36 }}>Save Every Crumb</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
          {[
            { icon: "🛍️", text: "Mua box bánh ngon giá ưu đãi 50–70%" },
            { icon: "♻️", text: "Góp phần giảm lãng phí thực phẩm" },
            { icon: "📍", text: "Tìm tiệm bánh gần bạn theo thời gian thực" },
          ].map((item) => (
            <div key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <p style={{ position: "absolute", bottom: 28, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>© 2026 CrumbUp</p>
    </div>
  );
}

function Req() { return <span style={{ color: "var(--danger)" }}>*</span>; }

function ComingSoonBox({ msg }: { msg: string }) {
  return (
    <div style={{ marginTop: 12, padding: "11px 14px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, fontSize: 13, color: "#92400e" }}>
      {msg}
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return <div style={{ marginTop: 14, padding: "11px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "var(--danger)" }}>{msg}</div>;
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 24px" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function OAuthBtn({ icon, label, loading, primary = false, onClick }: {
  icon: React.ReactNode; label: string; loading: boolean; primary?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", padding: "13px 16px", borderRadius: 12,
      border: primary ? "none" : "1.5px solid var(--border)",
      background: primary ? "var(--text)" : "white",
      display: "flex", alignItems: "center", gap: 12,
      fontSize: 14, fontWeight: 700,
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

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.313 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8 };
const inp: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 14, outline: "none", background: "var(--ivory)", transition: "border-color 0.2s", boxSizing: "border-box" };
const btn: React.CSSProperties = { width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, borderRadius: 12, background: "var(--text)", color: "white", border: "none", cursor: "pointer" };
