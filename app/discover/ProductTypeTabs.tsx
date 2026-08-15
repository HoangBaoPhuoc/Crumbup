"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, usePathname } from "next/navigation";
import { useDiscoverNav } from "./DiscoverNavContext";

const TYPES = [
  { label: "Tất cả",         value: "" },
  { label: "Surprise Box", value: "SURPRISE_BOX" },
  // Store announcements and platform vouchers used to share one "Chương
  // trình khuyến mãi" tab — different enough (informational vs claimable)
  // that lumping them together read as one type was confusing. Split.
  { label: "Chương trình khuyến mãi", value: "ANNOUNCEMENT" },
  { label: "Mã giảm giá",             value: "VOUCHER" },
];

// Not a real filter — clicking it just opens the "coming soon" popup below.
const COMING_SOON_TAB = { label: "Trải nghiệm sớm sản phẩm mới" };

export default function ProductTypeTabs({ current }: { current: string }) {
  const pathname = usePathname();
  const params   = useSearchParams();
  const { navigate, isPending } = useDiscoverNav();

  const [active, setActive]           = useState(current);
  const [mounted, setMounted]         = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const searchKey = params.toString();
  useEffect(() => {
    setActive(params.get("type") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  function setType(value: string) {
    setActive(value);
    const next = new URLSearchParams(params.toString());
    if (value) next.set("type", value);
    else next.delete("type");
    next.delete("page");
    navigate(`${pathname}?${next.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => setType(t.value)}
          className={active === t.value ? "btn btn-primary" : "btn btn-ghost"}
          style={{ fontSize: 12, padding: "8px 14px" }}
        >
          {t.label}
        </button>
      ))}
      <button
        onClick={() => setComingSoonOpen(true)}
        className="btn btn-ghost"
        style={{ fontSize: 12, padding: "8px 14px" }}
      >
        {COMING_SOON_TAB.label}
      </button>
      {isPending && (
        <span style={{
          width: 13, height: 13, border: "2px solid var(--border)",
          borderTopColor: "var(--primary)", borderRadius: "50%",
          display: "inline-block", animation: "spin 0.7s linear infinite",
        }} />
      )}

      {mounted && comingSoonOpen && createPortal(
        <div
          onClick={() => setComingSoonOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)",
            display: "grid", placeItems: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 360, background: "white", borderRadius: 20,
              padding: "32px 28px", textAlign: "center", position: "relative",
              boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
            }}
          >
            <button
              onClick={() => setComingSoonOpen(false)}
              style={{
                position: "absolute", top: 14, right: 14, width: 28, height: 28,
                borderRadius: "50%", border: "none", background: "var(--cream)",
                display: "grid", placeItems: "center", cursor: "pointer",
                fontSize: 16, color: "var(--text-muted)",
              }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>{COMING_SOON_TAB.label}</h3>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
              Tính năng đang được phát triển. Quay lại sau nhé!
            </p>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
