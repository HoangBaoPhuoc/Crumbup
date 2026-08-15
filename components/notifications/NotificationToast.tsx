"use client";

import { useEffect } from "react";

export type ToastItem = { id: string; type: string; orderId: string | null; title: string; body: string | null };

const AUTO_DISMISS_MS = 7000;

export default function NotificationToast({
  item, onOpen, onDismiss,
}: {
  item: ToastItem; onOpen: () => void; onDismiss: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={onOpen}
      style={{
        width: 320, background: "white", borderRadius: 14, border: "1px solid var(--border)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)", padding: "14px 16px",
        cursor: "pointer", animation: "rise 0.25s ease both",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{item.title}</div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          style={{
            width: 20, height: 20, borderRadius: "50%", border: "none",
            background: "var(--cream)", color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
            flexShrink: 0, display: "grid", placeItems: "center",
          }}
        >✕</button>
      </div>
      {item.body && (
        <div style={{
          fontSize: 13, color: "var(--text-muted)", marginTop: 4,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {item.body}
        </div>
      )}
    </div>
  );
}
