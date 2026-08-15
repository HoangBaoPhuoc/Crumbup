"use client";

import Link from "next/link";
import { useNotifications } from "@/components/notifications/NotificationsProvider";

export default function OrdersNavLink() {
  const { unreadCount: unread } = useNotifications();

  return (
    <Link href="/orders" className="header-icon-btn" style={{
      position: "relative",
      width: 38, height: 38, borderRadius: 10,
      display: "grid", placeItems: "center",
      textDecoration: "none", flexShrink: 0,
    }} title="Đơn hàng của tôi">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="20" r="1.5"/>
        <circle cx="18" cy="20" r="1.5"/>
        <path d="M2 3h2l2.4 12.2a2 2 0 002 1.8h9.2a2 2 0 002-1.8L21 7H6"/>
      </svg>
      {unread > 0 && (
        <span style={{
          position: "absolute", top: 2, right: 2,
          minWidth: 15, height: 15, padding: "0 3px", borderRadius: 999,
          background: "#dc2626", color: "white", fontSize: 9, fontWeight: 800,
          display: "grid", placeItems: "center", border: "1.5px solid white",
        }}>
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
