"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ChatThread from "./ChatThread";
import { OPEN_CHAT_EVENT, type OpenChatDetail } from "./chatBus";
import { useNotifications } from "@/components/notifications/NotificationsProvider";

// Idle it's a round FAB floating a bit off the corner, icon-only; hovering
// widens it into a pill revealing the "Chat" label. Opening it swaps the tab
// out for the panel (flush to the bottom-right corner) rather than stacking
// a separate panel above it — one continuous piece, Messenger-style.
const TAB_MARGIN = 20;
const TAB_HEIGHT = 46;
const TAB_WIDTH_COLLAPSED = 46;
const TAB_WIDTH_EXPANDED  = 100;
export const CHAT_PANEL_BOTTOM = TAB_MARGIN + TAB_HEIGHT + 10;

type ConversationSummary = {
  id: string;
  otherPartyName: string;
  otherPartyLogo: string | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
};

export default function ChatBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loggedIn, isBusiness, unreadCount: unread, refresh: refreshUnread } = useNotifications();
  const [open, setOpen]             = useState(false);
  const [tabHovered, setTabHovered] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const [resolving, setResolving]   = useState(false);
  const [resolveError, setResolveError] = useState("");

  // NotificationsProvider resets to logged-out state on SIGNED_OUT; mirror
  // that here so the panel/conversation list don't linger after logout.
  useEffect(() => {
    if (!loggedIn) {
      setOpen(false);
      setConversations(null);
      setActiveId(null);
    }
  }, [loggedIn]);

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations);
  }

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) { setActiveId(null); setResolveError(""); loadConversations(); }
      return next;
    });
  }

  function backToList() {
    setActiveId(null);
    setResolveError("");
    loadConversations();
    refreshUnread();
  }

  // Any "Nhắn tin" button anywhere in the app dispatches this instead of
  // opening its own modal — jump straight into the resolved conversation here.
  useEffect(() => {
    async function handleOpenChat(e: Event) {
      const detail = (e as CustomEvent<OpenChatDetail>).detail;
      if (!detail) return;
      setOpen(true);
      setActiveId(null);
      setResolveError("");
      setResolving(true);
      try {
        const res = await fetch("/api/conversations/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detail),
        });
        const data = await res.json();
        if (!res.ok) { setResolveError(data.error ?? "Lỗi mở cuộc trò chuyện"); return; }
        setActiveId(data.conversationId);
        setActiveName(data.otherPartyName);
      } catch {
        setResolveError("Lỗi kết nối");
      } finally {
        setResolving(false);
      }
    }
    window.addEventListener(OPEN_CHAT_EVENT, handleOpenChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handleOpenChat);
  }, []);

  function viewAll() {
    setOpen(false);
    router.push(isBusiness ? "/partner?tab=messages" : "/messages");
  }

  // The corner widget is redundant on pages that already show the full chat
  // UI (the dedicated /messages page, and the partner "Tin nhắn" tab).
  const hideBubble = pathname === "/messages" || (pathname === "/partner" && (searchParams.get("tab") ?? "overview") === "messages");

  useEffect(() => {
    if (hideBubble) setOpen(false);
  }, [hideBubble]);

  if (!loggedIn || hideBubble) return null;

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 0, right: 12, zIndex: 9998,
          width: 340, maxWidth: "calc(100vw - 24px)", height: 460, maxHeight: "72vh",
          background: "white", borderRadius: "18px 18px 0 0", border: "1px solid var(--border)", borderBottom: "none",
          boxShadow: "0 16px 48px rgba(0,0,0,0.22)", overflow: "hidden",
          display: "flex", flexDirection: "column",
          animation: "rise 0.2s ease both",
        }}>
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 8,
          }}>
            {activeId ? (
              <button
                onClick={backToList}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text)", fontSize: 15, fontWeight: 800, minWidth: 0 }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>‹</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeName}</span>
              </button>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Tin nhắn</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {!activeId && (
                <button onClick={viewAll} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--primary)", fontSize: 12, fontWeight: 700 }}>
                  Xem tất cả
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--border)",
                  background: "white", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 11, flexShrink: 0,
                }}
              >✕</button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: activeId ? "hidden" : "auto" }}>
            {resolving ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Đang tải...</div>
            ) : resolveError ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "#b91c1c", fontSize: 14 }}>{resolveError}</div>
            ) : activeId ? (
              <ChatThread conversationId={activeId} onMeta={setActiveName} onRead={refreshUnread} />
            ) : conversations === null ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Đang tải...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Chưa có cuộc trò chuyện nào.</div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveId(c.id); setActiveName(c.otherPartyName); }}
                  onMouseEnter={() => setHoveredConvId(c.id)}
                  onMouseLeave={() => setHoveredConvId((v) => v === c.id ? null : v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "12px 18px", cursor: "pointer", textAlign: "left",
                    borderTop: "none",
                    borderBottom: "1px solid var(--border)",
                    borderLeft: c.unreadCount > 0 ? "3px solid #dc2626" : "3px solid transparent",
                    borderRight: "none",
                    background: hoveredConvId === c.id ? "var(--cream)" : (c.unreadCount > 0 ? "var(--primary-soft)" : "white"),
                    transition: "background 0.12s ease",
                  }}
                >
                  {c.otherPartyLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.otherPartyLogo} alt={c.otherPartyName} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: "var(--cream)", display: "grid", placeItems: "center",
                      fontSize: 14, fontWeight: 800, color: "var(--text-muted)",
                    }}>
                      {c.otherPartyName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: c.unreadCount > 0 ? 800 : 600, color: "var(--text)" }}>{c.otherPartyName}</div>
                    {c.lastMessage && (
                      <div style={{
                        fontSize: 12, color: c.unreadCount > 0 ? "var(--text)" : "var(--text-muted)",
                        marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {c.lastMessage.body}
                      </div>
                    )}
                  </div>
                  {c.unreadCount > 0 && (
                    <span style={{
                      minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999,
                      background: "#dc2626", color: "white", fontSize: 9, fontWeight: 700,
                      display: "grid", placeItems: "center", flexShrink: 0,
                    }}>
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {!open && (() => {
        const expanded = tabHovered;
        return (
          // Wrapper handles fixed positioning + the unread badge (which pokes
          // outside the button's box); the button itself owns overflow:hidden
          // for the width-collapse animation, so the badge can't live inside
          // it without getting clipped.
          <div
            style={{ position: "fixed", bottom: TAB_MARGIN, right: TAB_MARGIN, zIndex: 9998 }}
            onMouseEnter={() => setTabHovered(true)}
            onMouseLeave={() => setTabHovered(false)}
          >
            <button
              onClick={toggleOpen}
              aria-label="Mở tin nhắn"
              style={{
                width: expanded ? TAB_WIDTH_EXPANDED : TAB_WIDTH_COLLAPSED,
                height: TAB_HEIGHT,
                borderRadius: TAB_HEIGHT / 2,
                background: "var(--primary)", color: "white", border: "none",
                boxShadow: "0 4px 16px rgba(134,21,25,0.35)", cursor: "pointer",
                display: "flex", alignItems: "center",
                justifyContent: expanded ? "flex-start" : "center",
                gap: expanded ? 8 : 0, paddingLeft: expanded ? 14 : 0,
                overflow: "hidden", transition: "width 0.18s ease",
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span style={{
                fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden",
                maxWidth: expanded ? 40 : 0, opacity: expanded ? 1 : 0,
                transition: "opacity 0.15s ease, max-width 0.18s ease",
              }}>
                Chat
              </span>
            </button>
            {unread > 0 && (
              <span style={{
                position: "absolute", top: -6, left: -6,
                minWidth: 20, height: 20, padding: "0 4px", borderRadius: 999,
                background: "#dc2626", color: "white", fontSize: 11, fontWeight: 800,
                display: "grid", placeItems: "center", border: "2px solid white",
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
        );
      })()}
    </>
  );
}
