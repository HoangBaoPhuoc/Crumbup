"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Tổng quan",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/admin/customers",
    label: "Khách hàng",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
      </svg>
    ),
  },
  {
    href: "/admin/businesses",
    label: "Cửa hàng",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    href: "/admin/pending",
    label: "Phê duyệt",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    badge: true,
  },
  {
    href: "/admin/boxes",
    label: "Box hôm nay",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
];

export default function AdminSidebar({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside style={{
      width: 228, background: "#ffffff", display: "flex", flexDirection: "column",
      padding: "24px 12px", position: "sticky", top: 0, height: "100vh",
      flexShrink: 0, borderRight: "1px solid #e5d5c8",
    }}>
      {/* Brand */}
      <div style={{ paddingLeft: 12, marginBottom: 32 }}>
        <div style={{ fontSize: 21, fontWeight: 900, color: "#3d2f1f", letterSpacing: "-0.02em" }}>CrumbUp</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#b87c52", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
          Admin
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10,
              background: active ? "#f0e5d8" : "transparent",
              color: active ? "#b87c52" : "#78716c",
              fontWeight: active ? 700 : 500, fontSize: 16,
              textDecoration: "none", transition: "all 0.12s",
              position: "relative",
            }}>
              <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span style={{
                  background: "#b87c52", color: "white",
                  fontSize: 11, fontWeight: 800,
                  padding: "1px 7px", borderRadius: 999,
                  minWidth: 20, textAlign: "center",
                }}>
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button onClick={logout} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 10, marginTop: 8,
        background: "transparent", border: "none",
        color: "#78716c", fontSize: 16, fontWeight: 500,
        cursor: "pointer", width: "100%", textAlign: "left",
        transition: "color 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#b87c52")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#78716c")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Đăng xuất
      </button>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e5d5c8", fontSize: 11, color: "#c4a882", paddingLeft: 12 }}>
        © 2026 CrumbUp
      </div>
    </aside>
  );
}
