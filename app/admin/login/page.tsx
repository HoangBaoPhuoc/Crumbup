"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function login() {
    setError("");
    if (!email || !password) { setError("Vui lòng điền đầy đủ thông tin"); return; }
    setLoading(true);
    const res  = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Đăng nhập thất bại"); return; }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#f7f0e4",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#3d2f1f", letterSpacing: "-0.03em" }}>CrumbUp</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#b87c52", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>
            Admin Portal
          </div>
        </div>

        <div style={{
          background: "#ffffff", borderRadius: 20, padding: "36px 32px",
          border: "1px solid #e5d5c8",
          boxShadow: "0 4px 24px -8px rgba(61,47,31,0.08)",
        }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: "#3d2f1f", marginBottom: 24 }}>Đăng nhập quản trị</h1>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Email admin</label>
            <input type="email" value={email} placeholder="admin@crumbup.vn"
              onChange={(e) => setEmail(e.target.value)} style={inp}
              onKeyDown={(e) => e.key === "Enter" && login()} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={lbl}>Mật khẩu</label>
            <input type="password" value={password} placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)} style={inp}
              onKeyDown={(e) => e.key === "Enter" && login()} />
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: "10px 14px", background: "#fef2f2",
              border: "1px solid #fecaca", borderRadius: 10, fontSize: 15, color: "#b91c1c",
            }}>
              {error}
            </div>
          )}

          <button onClick={login} disabled={loading} style={{
            width: "100%", padding: "13px", borderRadius: 12,
            background: loading ? "#c4a882" : "#b87c52", color: "white",
            border: "none", fontSize: 17, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#b87c52" }}>
          Chỉ dành cho nhân viên CrumbUp
        </p>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 15, fontWeight: 600, color: "#78716c", marginBottom: 8,
};
const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid #e5d5c8", background: "#fefbf7",
  fontSize: 16, color: "#3d2f1f", outline: "none",
  boxSizing: "border-box",
};
