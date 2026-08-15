"use client";

import { useRef } from "react";
import Link from "next/link";

// Header (title + kind pill + optional "see all" link + count + prev/next
// arrows) wrapping a horizontally-scrollable strip of cards. Cards are
// passed as children — they're fetched/rendered server-side, this component
// just adds the scroll-by-arrow interactivity on top.
export default function PromoStrip({
  title, pillLabel, pillBg, pillColor, count, countLabel, seeAllHref, children,
}: {
  title: string;
  pillLabel: string;
  pillBg: string;
  pillColor: string;
  count: number;
  countLabel: string;
  seeAllHref?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollByCard(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 296, behavior: "smooth" });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0, whiteSpace: "nowrap" }}>{title}</h3>
        <span style={{
          padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: pillBg, color: pillColor, whiteSpace: "nowrap",
        }}>
          {pillLabel}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {seeAllHref && (
            <Link href={seeAllHref} style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none", whiteSpace: "nowrap" }}>
              Xem tất cả →
            </Link>
          )}
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
            {count} {countLabel}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => scrollByCard(-1)} aria-label="Trước" style={arrowBtnStyle}>‹</button>
            <button onClick={() => scrollByCard(1)} aria-label="Sau" style={arrowBtnStyle}>›</button>
          </div>
        </div>
      </div>
      {/* overflowX: auto implicitly forces overflow-y too (CSS computed-value
          rule), and overflow only clips at the padding edge — not the content
          edge. A hover lift/shadow that pokes past the card's own box was
          getting clipped by that boundary since there was barely any padding
          to clip into. Pad generously, cancel with a matching negative margin
          so cards still line up with the heading above instead of looking
          indented. */}
      <div ref={scrollRef} className="promo-carousel" style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -20px", padding: "12px 20px 26px" }}>
        {children}
      </div>
    </div>
  );
}

const arrowBtnStyle: React.CSSProperties = {
  width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--border)",
  background: "white", color: "var(--text-muted)", cursor: "pointer",
  display: "grid", placeItems: "center", fontSize: 13, flexShrink: 0,
};
