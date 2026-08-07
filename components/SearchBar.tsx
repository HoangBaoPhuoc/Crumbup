"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";

const PAGES = [
  { label: "Sứ mệnh & Tầm nhìn", href: "/about#about",    group: "Về chúng tôi" },
  { label: "Lịch sử",             href: "/about#history",  group: "Về chúng tôi" },
  { label: "ESG & Impact",         href: "/about#esg",      group: "Về chúng tôi" },
  { label: "Mô hình kinh doanh",   href: "/about#business", group: "Về chúng tôi" },
  { label: "Câu hỏi thường gặp",   href: "/about#faq",      group: "Hỗ trợ" },
  { label: "Hướng dẫn sử dụng",    href: "/delivery",       group: "Hỗ trợ" },
  { label: "Chính sách bảo mật",   href: "/about#faq",      group: "Hỗ trợ" },
  { label: "Chính sách đổi trả",   href: "/about#faq",      group: "Hỗ trợ" },
  { label: "Khám phá box",         href: "/discover",       group: "Trang" },
  { label: "Cho cửa hàng",         href: "/for-stores",     group: "Trang" },
  { label: "Đăng ký cửa hàng",     href: "/register/business", group: "Trang" },
  { label: "Đơn hàng của tôi",     href: "/orders",         group: "Trang" },
];

type BoxResult = {
  id: string; name: string; priceSale: number; image: string | null;
  store: { name: string };
};

export default function SearchBar() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery]     = useState("");
  const [focused, setFocused] = useState(false);
  const [boxes, setBoxes]     = useState<BoxResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos]         = useState<{ top: number; left: number; width: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  // Sync query from URL when on /discover
  useEffect(() => {
    if (pathname === "/discover") {
      setQuery(searchParams.get("q") ?? "");
    } else {
      setQuery("");
    }
    setFocused(false);
  }, [pathname, searchParams]);

  const q    = query.trim();
  const open = focused && q.length >= 1;

  const filteredPages = PAGES.filter((p) =>
    q.length >= 1 && p.label.toLowerCase().includes(q.toLowerCase())
  );
  const showDropdown = open && (filteredPages.length > 0 || loading || boxes.length > 0 || q.length >= 2);

  // Update dropdown position whenever it opens
  useEffect(() => {
    if (showDropdown && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 340) });
    }
  }, [showDropdown, query]);

  // Debounced box search
  useEffect(() => {
    if (!open || q.length < 2) { setBoxes([]); setLoading(false); return; }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setBoxes(data);
      } catch { setBoxes([]); }
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        const dropdown = document.getElementById("search-dropdown");
        if (!dropdown?.contains(e.target as Node)) setFocused(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function navigate(href: string) {
    setFocused(false);
    setQuery("");
    router.push(href);
  }

  function onEnter() {
    if (!q) return;
    navigate(`/discover?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <div
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 12,
          border: `1.5px solid ${focused ? "var(--primary)" : "transparent"}`,
          background: focused ? "white" : "var(--ivory)",
          width: focused ? 240 : 180,
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1), border-color 0.2s, background 0.2s",
          cursor: "text", position: "relative",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, color: "var(--text-muted)" }}>
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => { if (e.key === "Enter") onEnter(); }}
          placeholder="Tìm box, trang..."
          style={{
            border: "none", outline: "none", background: "transparent",
            fontSize: 16, color: "var(--text)", width: "100%", caretColor: "var(--primary)",
          }}
        />
        {query && (
          <button
            onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }}
            style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, lineHeight: 1, flexShrink: 0, fontSize: 16 }}
          >✕</button>
        )}
      </div>

      {mounted && showDropdown && pos && createPortal(
        <div
          id="search-dropdown"
          className="user-menu-dropdown"
          style={{
            position: "fixed", top: pos.top, left: pos.left, width: pos.width,
            background: "white", borderRadius: 16, border: "1px solid var(--border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 99999,
            overflow: "hidden", maxHeight: "70vh", overflowY: "auto",
          }}
        >
          {/* Page results */}
          {filteredPages.length > 0 && (
            <div>
              <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Trang
              </div>
              {filteredPages.map((p) => (
                <button
                  key={p.href + p.label}
                  onMouseDown={(e) => { e.preventDefault(); navigate(p.href); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--cream)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 12 }}>📄</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.group}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Box results */}
          {(loading || boxes.length > 0) && (
            <div style={{ borderTop: filteredPages.length > 0 ? "1px solid var(--border)" : "none" }}>
              <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Box hôm nay {!loading && `· ${boxes.length} kết quả`}
              </div>
              {loading ? (
                <div style={{ padding: "14px 16px", fontSize: 15, color: "var(--text-muted)" }}>Đang tìm...</div>
              ) : (
                boxes.map((b) => (
                  <button
                    key={b.id}
                    onMouseDown={(e) => { e.preventDefault(); navigate(`/box/${b.id}`); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, overflow: "hidden", background: "var(--cream)", display: "grid", placeItems: "center", fontSize: 21 }}>
                      {b.image
                        ? <img src={b.image} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : "🥐"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.store.name}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                      {b.priceSale.toLocaleString("vi-VN")}đ
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* No results */}
          {!loading && q.length >= 2 && filteredPages.length === 0 && boxes.length === 0 && (
            <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
              Không tìm thấy kết quả cho &ldquo;{q}&rdquo;
            </div>
          )}

          {/* Footer hint */}
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, background: "var(--ivory)" }}>
            <kbd style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "white", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "inherit" }}>Enter</kbd>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>để tìm tất cả box trên trang Khám phá</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
