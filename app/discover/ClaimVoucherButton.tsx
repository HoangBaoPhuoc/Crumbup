"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const TOAST_MS = 3500;

export default function ClaimVoucherButton({
  promotionId, isLoggedIn, variant = "default", compact = false,
}: {
  promotionId: string; isLoggedIn: boolean; variant?: "default" | "dark"; compact?: boolean;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode]       = useState<string | null>(null);
  const [error, setError]     = useState("");
  const [toast, setToast]     = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

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
    setToast(true);
  }

  const successToast = toast && typeof document !== "undefined" && createPortal(
    <div
      onClick={() => setToast(false)}
      style={{
        position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 10070,
        display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 999,
        background: "var(--text)", color: "white", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
        boxShadow: "0 12px 32px rgba(0,0,0,0.28)", cursor: "pointer", animation: "rise 0.2s ease both",
      }}
    >
      🎉 Nhận mã thành công!
      <a
        href="/orders" onClick={(e) => e.stopPropagation()}
        style={{ color: "white", textDecoration: "underline" }}
      >
        Xem trong &ldquo;Ưu đãi của tôi&rdquo;
      </a>
    </div>,
    document.body
  );

  if (code) {
    return (
      <>
        <div style={{ textAlign: "right", maxWidth: compact ? 100 : undefined }}>
          <div style={{ fontSize: compact ? 9 : 11, color: "var(--text-muted)", marginBottom: 2 }}>Mã của bạn</div>
          <div style={{ fontSize: compact ? 13 : 18, fontWeight: 800, letterSpacing: "0.06em", color: "var(--primary)", fontFamily: "monospace" }}>
            {code}
          </div>
          {!compact && (
            <a href="/orders" style={{ fontSize: 11, color: "var(--primary)", textDecoration: "underline" }}>
              Xem trong &ldquo;Ưu đãi của tôi&rdquo;
            </a>
          )}
        </div>
        {successToast}
      </>
    );
  }

  return (
    <div style={{ textAlign: "right" }}>
      <button
        onClick={claim} disabled={loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={variant === "dark" ? "btn" : "btn btn-primary"}
        style={{
          fontSize: compact ? 11 : 13, padding: compact ? "5px 10px" : "8px 16px",
          transform: hovered ? "translateY(-1px)" : "none",
          boxShadow: hovered ? "0 6px 14px -4px rgba(34,28,22,0.3)" : "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
          opacity: hovered && !loading ? 0.9 : 1,
          ...(variant === "dark" ? { background: "var(--text)", color: "white" } : {}),
        }}
      >
        {loading ? "..." : "Nhận mã"}
      </button>
      {error && <div style={{ fontSize: compact ? 9 : 11, color: "var(--danger)", marginTop: 4, maxWidth: compact ? 90 : 160 }}>{error}</div>}
    </div>
  );
}
