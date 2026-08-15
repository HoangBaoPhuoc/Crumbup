"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import type { Promotion, Store } from "@/app/generated/prisma/client";
import { dealBadge, formatVNDate, formatVNDateShort, shortAddress } from "@/lib/utils";
import { buildTicketClipPath } from "@/lib/ticketShape";
import { usePopupTransition } from "@/lib/usePopupTransition";
import ClaimVoucherButton from "@/app/discover/ClaimVoucherButton";

export type PromotionWithStore = Promotion & { store: Store };

// Text and the claim button used to sit side by side, fighting over the same
// row's width — any store name long enough pushed the button toward (or
// past) the edge no matter how wide the card got. Stacking the button below
// the text instead means each only has to fit the card's full width on its
// own, never share it — and since the button now uses vertical space that
// would've sat empty anyway, the card can go narrower than before too.
const CARD_WIDTH  = 220;
// +12px over the old 100 to give the address room to wrap onto a second line
// (it now includes the city, not just the street — see shortAddress) instead
// of being squeezed into one truncated line.
const CARD_HEIGHT = 112;
const DISCOUNT_ZONE_WIDTH = 64;
const CORNER_RADIUS = 10;
const NOTCH_RADIUS  = 4;
const NOTCH_COUNT   = 3;
const STROKE_PAD = 2;

export default function VoucherCard({ promo, isLoggedIn }: { promo: PromotionWithStore; isLoggedIn: boolean }) {
  const [hovered, setHovered] = useState(false);
  const { mounted, visible, openPopup, closePopup } = usePopupTransition();
  const badge = dealBadge(promo.dealType, promo.discountValue);
  const address = shortAddress(promo.store.address, promo.store.name);
  const clipId = `voucher-clip-${useId()}`;
  const clipPathD = buildTicketClipPath(CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS, NOTCH_RADIUS, NOTCH_COUNT);

  return (
    <>
      {/* A plain div, not <button> — it wraps an actual button (the claim
          action), and a button can't nest inside a button. Click anywhere
          except that button opens the detail popup; Enter/Space does too,
          for keyboard users. */}
      <div
        onClick={openPopup}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPopup(); } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="button" tabIndex={0}
        style={{
          position: "relative", flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH, height: CARD_HEIGHT,
          scrollSnapAlign: "start", cursor: "pointer",
          // box-shadow on the clipped child below gets clipped away right along
          // with everything else clip-path cuts — filter: drop-shadow on this
          // (unclipped) wrapper instead hugs the actual notched silhouette,
          // same as the shadow on every other hoverable card/row.
          filter: hovered ? "drop-shadow(0 8px 12px rgba(34,28,22,0.28))" : "none",
          transition: "filter 0.2s ease",
        }}
      >
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <path d={clipPathD} />
            </clipPath>
          </defs>
        </svg>

        <div style={{
          display: "flex", alignItems: "stretch", width: CARD_WIDTH, height: CARD_HEIGHT, overflow: "hidden",
          clipPath: `url(#${clipId})`, WebkitClipPath: `url(#${clipId})`,
          background: "white",
          transform: hovered ? "translateY(-2px)" : "none",
          transition: "transform 0.2s ease",
        }}>
          {/* Discount — bold on a solid color field instead of a floating
              circle (which looked like a stray blob), sitting right where
              the notches bite in so it reads as the ticket's "stub". */}
          <div style={{
            width: DISCOUNT_ZONE_WIDTH, flexShrink: 0, background: "var(--primary)",
            display: "grid", placeItems: "center", padding: "0 4px",
          }}>
            <span style={{
              fontSize: badge && badge.length > 5 ? 13 : 18, fontWeight: 900,
              color: "white", textAlign: "center", lineHeight: 1.05,
            }}>
              {badge ?? "Ưu đãi"}
            </span>
          </div>

          {/* Text on top, button on its own row below — neither ever shares
              its width with the other, so neither has to give up space to
              the other regardless of how long the store name is.
              justifyContent: space-between pins the button to the card's
              bottom edge instead of leaving dead space under it. */}
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ padding: "12px 12px 0 12px", overflow: "hidden" }}>
              <div style={{
                fontSize: 12, fontWeight: 800, color: "var(--text)", lineHeight: 1.25,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {promo.store.name}
              </div>
              {address && (
                <div style={{
                  fontSize: 9, color: "var(--text-muted)", marginTop: 1, lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {address}
                </div>
              )}
              <div style={{
                fontSize: 9, fontWeight: 600, color: "var(--text-muted)", marginTop: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                HSD {formatVNDateShort(promo.validUntil)}
              </div>
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", justifyContent: "flex-end", padding: "4px 12px 12px" }}
            >
              <ClaimVoucherButton promotionId={promo.id} isLoggedIn={isLoggedIn} variant="dark" compact />
            </div>
          </div>
        </div>

        <svg
          viewBox={`${-STROKE_PAD} ${-STROKE_PAD} ${CARD_WIDTH + STROKE_PAD * 2} ${CARD_HEIGHT + STROKE_PAD * 2}`}
          width={CARD_WIDTH + STROKE_PAD * 2} height={CARD_HEIGHT + STROKE_PAD * 2}
          style={{
            position: "absolute", top: -STROKE_PAD, left: -STROKE_PAD, pointerEvents: "none",
            transform: hovered ? "translateY(-2px)" : "none", transition: "transform 0.2s ease",
          }}
          aria-hidden
        >
          <path d={clipPathD} fill="none" stroke={hovered ? "var(--primary)" : "var(--border)"} strokeWidth={hovered ? 2 : 1} />
        </svg>
      </div>

      {mounted && typeof document !== "undefined" && createPortal(
        <div
          onClick={closePopup}
          style={{
            position: "fixed", inset: 0, zIndex: 10060,
            background: visible ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
            transition: "background 0.2s ease",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 460, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto",
              background: "white", borderRadius: 22, overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.94)",
              transition: "opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div style={{ position: "relative", padding: "44px 28px 28px", background: "var(--primary-soft)", textAlign: "center" }}>
              <button
                onClick={closePopup}
                aria-label="Đóng"
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 32, height: 32, borderRadius: "50%", border: "none",
                  background: "rgba(0,0,0,0.12)", color: "var(--primary-dark)", cursor: "pointer",
                  display: "grid", placeItems: "center", fontSize: 15,
                }}
              >✕</button>
              <div style={{ fontSize: 52, fontWeight: 900, color: "var(--primary)", lineHeight: 1 }}>
                {badge ?? "Ưu đãi"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary-dark)", marginTop: 8 }}>
                {promo.store.name}
              </div>
              {address && (
                <div style={{ fontSize: 13, color: "var(--primary-dark)", opacity: 0.75, marginTop: 2 }}>
                  {address}
                </div>
              )}
            </div>

            <div style={{ padding: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 12px", lineHeight: 1.3 }}>
                {promo.title}
              </h2>
              {promo.description && (
                <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 16px" }}>
                  {promo.description}
                </p>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginBottom: 20 }}>
                Hiệu lực {formatVNDate(promo.validFrom)} – {formatVNDate(promo.validUntil)}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ClaimVoucherButton promotionId={promo.id} isLoggedIn={isLoggedIn} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
