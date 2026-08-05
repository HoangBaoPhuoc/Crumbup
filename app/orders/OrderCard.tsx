"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { formatVNDate } from "@/lib/utils";
import type { OrderWithRelations } from "./page";

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PICKED_UP: "Đã nhận hàng",
  CANCELLED: "Đã hủy",
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDING:   { background: "#fef3c7", color: "#92400e" },
  CONFIRMED: { background: "#dbeafe", color: "#1e40af" },
  PICKED_UP: { background: "#dcfce7", color: "#15803d" },
  CANCELLED: { background: "#f1f5f9", color: "#94a3b8" },
};

export default function OrderCard({ order }: { order: OrderWithRelations }) {
  const [mounted, setMounted]         = useState(false);
  const [showStore, setShowStore]     = useState(false);

  useEffect(() => setMounted(true), []);

  const isConfirmed = order.status === "CONFIRMED";
  const isPickedUp  = order.status === "PICKED_UP";
  const isActive    = order.status === "PENDING" || order.status === "CONFIRMED";
  const canReview   = isPickedUp && !order.review;
  const firstBox    = order.items[0]?.box;
  const extraItems  = order.items.length - 1;

  let isExpired = false;
  if (isActive && firstBox) {
    const nowVN   = new Date(Date.now() + 7 * 60 * 60_000);
    const nowHHMM = `${String(nowVN.getUTCHours()).padStart(2, "0")}:${String(nowVN.getUTCMinutes()).padStart(2, "0")}`;
    const boxDate = new Date(firstBox.date.getTime() + 7 * 60 * 60_000).toISOString().slice(0, 10);
    const todayVN = nowVN.toISOString().slice(0, 10);
    isExpired = boxDate < todayVN || (boxDate === todayVN && firstBox.pickupEnd < nowHHMM);
  }

  const borderColor = isExpired ? "#fca5a5" : isConfirmed ? "var(--primary)" : "var(--border)";
  const borderWidth = (isExpired || isConfirmed) ? 2 : 1;
  const { store } = order;

  return (
    <>
      <div style={{
        background: "white", borderRadius: 18,
        border: `${borderWidth}px solid ${borderColor}`,
        overflow: "hidden",
      }}>
        {isExpired && (
          <div style={{
            background: "#fee2e2", color: "#b91c1c",
            padding: "8px 20px", fontSize: 12, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            ⏰ Đã quá giờ nhận hàng — đơn hàng hết hạn
          </div>
        )}

        {isConfirmed && !isExpired && (
          <div style={{
            background: "var(--primary)", color: "white",
            padding: "8px 20px", fontSize: 12, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>Đơn đã được xác nhận — Mã nhận hàng:</span>
            <span style={{
              background: "rgba(255,255,255,0.25)", borderRadius: 6,
              padding: "2px 10px", letterSpacing: "0.12em", fontFamily: "monospace", fontSize: 16,
            }}>
              {order.pickupCode.slice(0, 8).toUpperCase()}
            </span>
          </div>
        )}

        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{store.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {store.address.split(",")[0]}
              </div>
            </div>
            <span style={{
              padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              ...(isExpired ? { background: "#fee2e2", color: "#b91c1c" } : STATUS_STYLE[order.status]),
            }}>
              {isExpired ? "Hết hạn" : STATUS_LABEL[order.status]}
            </span>
          </div>

          <div style={{ background: "var(--ivory)", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                {firstBox?.name ?? "—"}
                {extraItems > 0 && (
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> +{extraItems} box khác</span>
                )}
              </div>
              {order.items[0] && order.items[0].quantity > 1 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>
                  × {order.items[0].quantity}
                </span>
              )}
            </div>
            {firstBox && (
              <div style={{ fontSize: 16, fontWeight: 800, color: isExpired ? "#9ca3af" : "var(--primary)" }}>
                {firstBox.pickupStart} – {firstBox.pickupEnd}
              </div>
            )}
            {firstBox && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {formatVNDate(firstBox.date)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              {order.status === "PICKED_UP" && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                  Mã: <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text)" }}>
                    {order.pickupCode.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: 900, color: isExpired ? "#9ca3af" : "var(--primary)" }}>
                {order.total.toLocaleString("vi-VN")}đ
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {canReview && (
                <Link href={`/review/${order.id}`} style={{
                  padding: "8px 16px", borderRadius: 10,
                  background: "var(--primary)", color: "white",
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}>
                  Đánh giá
                </Link>
              )}
              <button
                onClick={() => setShowStore(true)}
                style={{
                  padding: "8px 16px", borderRadius: 10,
                  border: "1px solid var(--border)", color: "var(--text-muted)",
                  fontSize: 12, fontWeight: 600, background: "white", cursor: "pointer",
                }}
              >
                Xem cửa hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Store info modal */}
      {mounted && showStore && createPortal(
        <div
          onClick={() => setShowStore(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 24, width: "100%", maxWidth: 400,
              boxShadow: "0 24px 64px rgba(0,0,0,0.25)", overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              background: "var(--cream)", padding: "28px 24px 20px",
              textAlign: "center", position: "relative",
            }}>
              <button
                onClick={() => setShowStore(false)}
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 28, height: 28, borderRadius: "50%",
                  border: "1px solid var(--border)", background: "white",
                  cursor: "pointer", display: "grid", placeItems: "center", fontSize: 12,
                }}
              >✕</button>

              {store.logo ? (
                <img src={store.logo} alt={store.name} style={{
                  width: 72, height: 72, borderRadius: "50%", objectFit: "cover",
                  border: "3px solid white", marginBottom: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }} />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "var(--primary-soft)", display: "grid", placeItems: "center",
                  fontSize: 37, margin: "0 auto 12px",
                  border: "3px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}>🏪</div>
              )}

              <div style={{ fontSize: 21, fontWeight: 900, color: "var(--text)" }}>{store.name}</div>
            </div>

            {/* Info rows */}
            <div style={{ padding: "8px 0 20px" }}>
              {[
                { ic: "📍", label: store.address },
                store.phone ? { ic: "📞", label: store.phone, href: `tel:${store.phone}` } : null,
                store.owner.email ? { ic: "✉️", label: store.owner.email, href: `mailto:${store.owner.email}` } : null,
              ].filter(Boolean).map((row) => (
                <div key={row!.ic} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "12px 24px", borderBottom: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{row!.ic}</span>
                  {row!.href ? (
                    <a href={row!.href} style={{
                      fontSize: 16, fontWeight: 600, color: "var(--primary)",
                      textDecoration: "none", wordBreak: "break-all",
                    }}>{row!.label}</a>
                  ) : (
                    <span style={{ fontSize: 16, color: "var(--text)", lineHeight: 1.5 }}>{row!.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
