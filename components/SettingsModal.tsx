"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OtpInput from "./OtpInput";

type Step = "loading" | "view" | "edit" | "otp";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const router = useRouter();

  const [step, setStep]         = useState<Step>("loading");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");   // current saved phone
  const [newPhone, setNewPhone] = useState("");    // phone being entered
  const [otp, setOtp]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name ?? "");
          setEmail(data.user.email ?? "");
          setPhone(data.user.phone ?? "");
        }
        setStep("view");
      })
      .catch(() => setStep("view"));
  }, []);

  function startEdit() {
    setError("");
    setNewPhone(phone.replace("+84", ""));
    setStep("edit");
  }

  async function sendOtp() {
    setError("");
    const digits = newPhone.replace(/\D/g, "");
    if (digits.length < 9) { setError("Số điện thoại không hợp lệ"); return; }

    setLoading(true);
    const res = await fetch("/api/auth/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send-phone-change-otp" }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) { setError(data.error); return; }
    setOtp("");
    setStep("otp");
  }

  async function confirmOtp() {
    setError("");
    if (otp.length < 6) { setError("Vui lòng nhập đủ 6 số"); return; }

    setLoading(true);
    const res = await fetch("/api/auth/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-phone-change", otp, phone: newPhone }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) { setError(data.error); return; }
    setPhone(data.phone);
    setSuccess("Đã cập nhật số điện thoại thành công!");
    setStep("view");
    router.refresh();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "grid", placeItems: "center", zIndex: 500, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, background: "white", borderRadius: 20,
          padding: "32px 30px", boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 18, right: 18, width: 30, height: 30,
            borderRadius: 999, border: "none", background: "var(--cream)",
            display: "grid", placeItems: "center", cursor: "pointer",
            fontSize: 18, color: "var(--text-muted)",
          }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: 23, fontWeight: 900, marginBottom: 22 }}>Cài đặt tài khoản</h2>

        {step === "loading" && (
          <p style={{ fontSize: 16, color: "var(--text-muted)" }}>Đang tải...</p>
        )}

        {/* ── VIEW ── */}
        {step === "view" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Họ và tên" value={name || "—"} />
            <Field label="Email" value={email || "—"} />

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                Số điện thoại
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>
                  {phone || "Chưa cập nhật"}
                </div>
                <button
                  onClick={startEdit}
                  style={{
                    marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--primary)",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  {phone ? "Đổi số" : "Thêm số"}
                </button>
              </div>
            </div>

            {success && <SuccessBox msg={success} />}
          </div>
        )}

        {/* ── EDIT PHONE ── */}
        {step === "edit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Nhập số điện thoại mới. Chúng tôi sẽ gửi mã xác thực đến email <strong>{email}</strong> để xác nhận trước khi đổi.
            </p>
            <div>
              <label style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Số điện thoại mới</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--cream)", fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                  🇻🇳 +84
                </div>
                <input
                  type="tel"
                  value={newPhone}
                  placeholder="901 234 567"
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  style={{ width: "100%", flex: 1, padding: "13px 16px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 16, outline: "none", background: "var(--ivory)", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {error && <ErrBox msg={error} />}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("view")} style={secondaryBtn}>Huỷ</button>
              <button onClick={sendOtp} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Đang gửi..." : "Gửi mã xác thực"}
              </button>
            </div>
          </div>
        )}

        {/* ── OTP ── */}
        {step === "otp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Nhập mã 6 số vừa gửi đến <strong>{email}</strong> để xác nhận đổi số điện thoại thành <strong>+84{newPhone}</strong>.
            </p>

            <OtpInput value={otp} onChange={setOtp} autoFocus />

            {error && <ErrBox msg={error} />}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("edit")} style={secondaryBtn}>Quay lại</button>
              <button onClick={confirmOtp} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Đang xác nhận..." : "Xác nhận"}
              </button>
            </div>

            <button
              onClick={sendOtp}
              disabled={loading}
              style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Gửi lại mã
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{value}</div>
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

function SuccessBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "11px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, fontSize: 15, color: "#166534" }}>
      {msg}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  flex: 1, padding: "13px", fontSize: 16, fontWeight: 700, borderRadius: 12,
  background: "var(--text)", color: "white", border: "none", cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  flex: 1, padding: "13px", fontSize: 16, fontWeight: 700, borderRadius: 12,
  background: "white", color: "var(--text)", border: "1.5px solid var(--border)", cursor: "pointer",
};
