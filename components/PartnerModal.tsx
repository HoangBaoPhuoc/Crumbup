"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  onClose: () => void;
}

export default function PartnerModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(30, 18, 8, 0.45)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* modal */}
      <div
        style={{
          position: "relative",
          background: "var(--surface)",
          borderRadius: 24,
          padding: "40px 44px",
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 24px 64px rgba(30,18,8,0.18)",
          border: "1px solid var(--border)",
          animation: "modal-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            cursor: "pointer",
            fontSize: 18,
            display: "grid",
            placeItems: "center",
            color: "var(--text-muted)",
          }}
        >
          ×
        </button>

        {/* header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Dành cho đối tác cửa hàng
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Tham gia CrumbUp để bán các box cuối ngày, tăng doanh thu và cùng cộng đồng giảm lãng phí thực phẩm.
          </p>
        </div>

        {/* benefits */}
        <div
          style={{
            background: "var(--cream, #fdf6ee)",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 28,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {[
            "Đăng box cuối ngày trong vài giây",
            "Không phí khởi tạo, không ràng buộc",
            "Quản lý đơn hàng và doanh thu dễ dàng",
            "Góp phần giảm lãng phí thực phẩm mỗi ngày",
          ].map((text) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
              <div style={{ width: 5, height: 5, borderRadius: 999, background: "var(--primary)", flexShrink: 0 }} />
              <span style={{ color: "var(--text)" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            href="/register/business"
            className="btn btn-primary"
            style={{ textAlign: "center", padding: "13px 0", fontSize: 17, fontWeight: 600, borderRadius: 12 }}
            onClick={onClose}
          >
            Đăng ký cửa hàng →
          </Link>
          <Link
            href="/login"
            className="btn btn-ghost"
            style={{ textAlign: "center", padding: "13px 0", fontSize: 16, borderRadius: 12 }}
            onClick={onClose}
          >
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
