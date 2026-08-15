"use client";

import { useState } from "react";
import Link from "next/link";
import PartnerLogoutButton from "./PartnerLogoutButton";
import { useNotifications } from "@/components/notifications/NotificationsProvider";

type NavItem = { label: string; href: string; key: string; badge?: number };

export default function Sidebar({
  navItems, activeTab, userName,
}: {
  navItems: NavItem[]; activeTab: string; userName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { unreadCount: unreadMessages } = useNotifications();

  const items = navItems.map((item) => item.key === "messages" ? { ...item, badge: unreadMessages } : item);

  return (
    <aside style={{
      width: expanded ? 220 : 60, background: "white", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", padding: expanded ? "24px 12px" : "24px 8px",
      position: "sticky", top: 0, height: "100vh", flexShrink: 0,
      transition: "width 0.15s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: expanded ? "flex-start" : "center",
        gap: 10, marginBottom: 20, paddingLeft: expanded ? 10 : 0,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, backgroundImage: "url('/crumbup-logo-nocap.jpg')", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
        </div>
        {expanded && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>CrumbUp</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cửa hàng</div>
          </div>
        )}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Thu gọn menu" : "Mở rộng menu"}
        className="partner-toggle-btn"
        style={{
          alignSelf: expanded ? "flex-end" : "center", marginBottom: 16,
          width: 26, height: 26, borderRadius: 8, border: "1px solid var(--border)",
          color: "var(--text-muted)", fontSize: 13, cursor: "pointer", display: "grid", placeItems: "center",
        }}
      >
        {expanded ? "‹" : "›"}
      </button>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item) => {
          const isActive = item.key === activeTab;
          return expanded ? (
            <Link
              key={item.key}
              href={item.href}
              className="partner-nav-link"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                padding: "8px 12px", borderRadius: 10,
                fontSize: 13, fontWeight: 600, color: isActive ? "var(--primary)" : "var(--text)",
                textDecoration: "none", whiteSpace: "nowrap",
                background: isActive ? "var(--primary-soft)" : undefined,
              }}
            >
              {item.label}
              {!!item.badge && (
                <span style={{
                  minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999,
                  background: "#dc2626", color: "white", fontSize: 10, fontWeight: 700,
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}>
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          ) : (
            <Link
              key={item.key}
              href={item.href}
              title={item.label}
              className="partner-nav-bar"
              style={{
                display: "block", height: 4, borderRadius: 999, margin: "6px 10px",
                background: isActive ? "var(--primary)" : item.badge ? "#dc2626" : undefined,
              }}
            />
          );
        })}
      </nav>

      <div style={{
        borderTop: "1px solid var(--border)", paddingTop: 14,
        paddingLeft: expanded ? 10 : 0, textAlign: expanded ? "left" : "center",
      }}>
        {expanded && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 2 }}>{userName}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Chủ cửa hàng</div>
            <PartnerLogoutButton />
          </>
        )}
      </div>
    </aside>
  );
}
