"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SettingsModal from "./SettingsModal";

interface Props {
  email: string;
  name: string;
}

export default function UserMenu({ email, name }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function logout() {
    await fetch("/api/auth/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/");
    router.refresh();
  }

  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
    : email[0].toUpperCase();

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--primary-soft)",
          border: `2px solid ${open ? "var(--primary)" : "var(--border)"}`,
          display: "grid", placeItems: "center",
          fontSize: 15, fontWeight: 800, color: "var(--primary)",
          cursor: "pointer", transition: "border-color 0.15s",
        }}
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          background: "white", borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          minWidth: 220, zIndex: 200,
          overflow: "hidden",
        }}>
          {/* User info */}
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2, color: "var(--text)" }}>
              {name || "Người dùng"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", wordBreak: "break-all" }}>
              {email}
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "8px 0" }}>
            <button
              onClick={() => { setOpen(false); setSettingsOpen(true); }}
              style={{
                width: "100%", padding: "10px 18px",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 15, fontWeight: 600,
                color: "var(--text)",
                background: "none", border: "none",
                cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span>⚙️</span> Cài đặt
            </button>
          </div>

          {/* Logout */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "8px 0" }}>
            <button onClick={logout} style={{
              width: "100%", padding: "10px 18px",
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 15, fontWeight: 600, color: "var(--danger)",
              background: "none", border: "none", cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span>🚪</span> Đăng xuất
            </button>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function MenuItem({ href, label, icon, onClick }: {
  href: string; label: string; icon: string; onClick: () => void;
}) {
  return (
    <a href={href} onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 18px", fontSize: 15, fontWeight: 600,
      color: "var(--text)", textDecoration: "none",
    }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--cream)")}
    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
    >
      <span>{icon}</span> {label}
    </a>
  );
}
