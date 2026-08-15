"use client";

import { createPortal } from "react-dom";
import type { Promotion, Store } from "@/app/generated/prisma/client";
import { dealBadge, formatVNDate, formatVNDateShort, PROMO_IMAGE_ASPECT, shortAddress } from "@/lib/utils";
import { usePopupTransition } from "@/lib/usePopupTransition";
import PromotionPlaceholderIcon from "./PromotionPlaceholderIcon";

export type PromotionWithStore = Promotion & { store: Store };

// +16px over the old 140 — the compact card now also shows the address
// (up to 2 lines, since it includes the city) and the expiry date, which
// didn't fit in the old height without crowding or clipping.
const CARD_HEIGHT = 156;
// Derived from the height so the image zone always matches PROMO_IMAGE_ASPECT
// exactly — the same ratio enforced at upload — instead of a hardcoded width
// that quietly drifts out of sync with it (object-fit: cover would then crop
// off more of the photo than the store owner actually chose).
const IMAGE_WIDTH = Math.round(CARD_HEIGHT * PROMO_IMAGE_ASPECT);
// Widened text zone (175 -> 225) so a typical short title ("Black Friday -
// 50% off") fits on one line instead of wrapping.
const CARD_WIDTH  = IMAGE_WIDTH + 225;

// Store's own announcement — no code, no claim, just information. Landscape
// card (image left, text right) instead of stacking the image on top — keeps
// the whole promo strip short instead of towering over the box list below.
// No ticket notches here — those are reserved for actual voucher codes so
// the two don't read as the same kind of thing. Tap to see the full
// description in a popup.
export default function AnnouncementCard({ promo }: { promo: PromotionWithStore }) {
  const { mounted, visible, openPopup, closePopup } = usePopupTransition();
  const badge = dealBadge(promo.dealType, promo.discountValue);
  const address = shortAddress(promo.store.address, promo.store.name);

  return (
    <>
      <button
        onClick={openPopup}
        className="box-row-hover"
        style={{
          flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH, height: CARD_HEIGHT, scrollSnapAlign: "start",
          display: "flex", textAlign: "left", cursor: "pointer",
          border: "1px solid var(--border)", borderRadius: 14, background: "white", overflow: "hidden", padding: 0,
        }}
      >
        <div style={{ position: "relative", width: IMAGE_WIDTH, flexShrink: 0, height: "100%", background: "var(--cream)" }}>
          {promo.image
            ? <img src={promo.image} alt={promo.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                <PromotionPlaceholderIcon kind={promo.kind} size={36} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              </div>}
          {badge && (
            <span style={{
              position: "absolute", top: 8, left: 8, whiteSpace: "nowrap",
              padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800,
              background: "var(--primary)", color: "white",
            }}>
              {badge}
            </span>
          )}
        </div>
        {/* Top content group aligned to the top, bottom row (HSD + Chi tiết)
            pinned to the card's bottom edge via space-between — same
            top-aligned structure as VoucherCard instead of vertically
            centering everything as a block. */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.06em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {promo.store.name}
            </div>
            {address && (
              <div style={{
                fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {address}
              </div>
            )}
            <h3 style={{
              fontSize: 15, margin: 0, color: "var(--text)", fontWeight: 800, lineHeight: 1.35,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {promo.title}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              HSD {formatVNDateShort(promo.validUntil)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", whiteSpace: "nowrap" }}>
              Chi tiết →
            </span>
          </div>
        </div>
      </button>

      {mounted && typeof document !== "undefined" && createPortal(
        <div
          onClick={closePopup}
          style={{
            position: "fixed", inset: 0, zIndex: 10060,
            background: visible ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)", transition: "background 0.2s ease",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 500, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto",
              background: "white", borderRadius: 22, overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.94)",
              transition: "opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div style={{ position: "relative", width: "100%", aspectRatio: PROMO_IMAGE_ASPECT, background: "var(--cream)" }}>
              {promo.image
                ? <img src={promo.image} alt={promo.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                    <PromotionPlaceholderIcon kind={promo.kind} size={52} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                  </div>}
              <button
                onClick={closePopup}
                aria-label="Đóng"
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 32, height: 32, borderRadius: "50%", border: "none",
                  background: "rgba(0,0,0,0.55)", color: "white", cursor: "pointer",
                  display: "grid", placeItems: "center", fontSize: 15,
                }}
              >✕</button>
              {badge && (
                <span style={{
                  position: "absolute", bottom: 14, left: 14, whiteSpace: "nowrap",
                  padding: "6px 14px", borderRadius: 8, fontSize: 16, fontWeight: 800,
                  background: "var(--primary)", color: "white",
                }}>
                  {badge}
                </span>
              )}
            </div>

            <div style={{ padding: 26 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                {promo.store.name}{address && ` · ${address}`}
              </div>
              <h2 style={{ fontSize: 23, fontWeight: 800, color: "var(--text)", margin: "0 0 12px", lineHeight: 1.3 }}>
                {promo.title}
              </h2>
              {promo.description && (
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, margin: "0 0 16px" }}>
                  {promo.description}
                </p>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
                Áp dụng tại cửa hàng · {formatVNDate(promo.validFrom)} – {formatVNDate(promo.validUntil)}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
