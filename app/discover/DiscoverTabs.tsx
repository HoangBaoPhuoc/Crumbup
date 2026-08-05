"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

export default function DiscoverTabs() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [toast, setToast]       = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });
  }, []);

  function requireLogin() {
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  }

  return (
    <>
      <div className="discover-tabs-inner" style={{ display: "flex", gap: 32 }}>
        {/* Khám phá Box — always active on this page */}
        <div style={tabStyle(true)}>Khám phá Box</div>

        {/* Đơn hàng của tôi */}
        {loggedIn ? (
          <Link href="/orders" style={{ ...tabStyle(false), textDecoration: "none" }}>
            Đơn hàng của tôi
          </Link>
        ) : (
          <div style={tabStyle(false)} onClick={requireLogin}>
            Đơn hàng của tôi
          </div>
        )}

      </div>

      {/* Toast — rendered via portal to escape stacking context */}
      {toast && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", top: 90, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "var(--text)", color: "white",
          borderRadius: 14, padding: "14px 22px",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
          fontSize: 16, fontWeight: 500,
          animation: "slideUp 0.25s ease",
          whiteSpace: "nowrap",
        }}>
          <span>Bạn cần đăng nhập để dùng tính năng này</span>
          <Link href="/login" style={{
            background: "var(--primary)", color: "white",
            padding: "6px 14px", borderRadius: 8,
            fontSize: 15, fontWeight: 700, textDecoration: "none",
          }}>
            Đăng nhập
          </Link>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "14px 0",
    fontSize: 16,
    fontWeight: active ? 700 : 500,
    color: active ? "var(--primary)" : "var(--text-muted)",
    borderBottom: active ? "3px solid var(--primary)" : "3px solid transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}
