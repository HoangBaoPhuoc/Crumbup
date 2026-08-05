import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "./NavLinks";
import SearchBar from "./SearchBar";
import MobileMenuToggle from "./MobileMenuToggle";
import UserMenu from "./UserMenu";

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="site-header">
      <Link href="/" className="logo">
        <div
          className="logo-mark"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "white",
            backgroundImage: "url('/crumbup-logo-nocap.jpg')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="logo-text">
          <strong>CrumbUp</strong>
          <span>Save Every Crumb</span>
        </div>
      </Link>

      {/* Desktop-only middle section */}
      <div className="header-middle" style={{ display: "contents" }}>
        <NavLinks />
        <Suspense fallback={<div style={{ width: 180, height: 38, borderRadius: 12, background: "var(--ivory)" }} />}>
          <SearchBar />
        </Suspense>
      </div>

      {/* Desktop-only auth buttons */}
      <div className="header-auth">
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/orders" style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--cream)", border: "1px solid var(--border)",
              display: "grid", placeItems: "center", color: "var(--text)",
              textDecoration: "none", flexShrink: 0,
            }} title="Đơn hàng của tôi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </Link>
            <UserMenu
              email={user.email ?? ""}
              name={user.user_metadata?.name ?? user.user_metadata?.full_name ?? ""}
            />
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/login" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 15 }}>
              Đăng nhập
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 15 }}>
              Đăng ký
            </Link>
          </div>
        )}
      </div>

      {/* Mobile hamburger — hidden on desktop via CSS */}
      <MobileMenuToggle isLoggedIn={!!user} />
    </header>
  );
}
