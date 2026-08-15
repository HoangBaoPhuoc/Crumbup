"use client";

import { useEffect, useState } from "react";
import ChatThread from "./ChatThread";

type ConversationSummary = {
  id: string;
  otherPartyName: string;
  otherPartyLogo: string | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
};

function fmtVN(date: string) {
  const d = new Date(new Date(date).getTime() + 7 * 60 * 60_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function MessengerView({ emptyText }: { emptyText: string }) {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const data: { conversations: ConversationSummary[] } = await res.json();
    setConversations(data.conversations);
    setActiveId((cur) =>
      cur && data.conversations.some((c) => c.id === cur) ? cur : (data.conversations[0]?.id ?? null)
    );
  }

  useEffect(() => { load(); }, []);

  // Refresh the list shortly after switching threads so unread badges/last-message
  // previews reflect the read-receipt ChatThread just marked.
  useEffect(() => {
    if (!activeId) return;
    const t = setTimeout(load, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const active = conversations?.find((c) => c.id === activeId) ?? null;

  return (
    <div style={{
      display: "flex", height: "100%", minHeight: 0,
      background: "white", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden",
    }}>
      {/* ── LEFT: conversation list ── */}
      <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto" }}>
        {conversations === null ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Đang tải...</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>{emptyText}</div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              onMouseEnter={() => setHoveredConvId(c.id)}
              onMouseLeave={() => setHoveredConvId((v) => v === c.id ? null : v)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "14px 18px", cursor: "pointer", textAlign: "left",
                borderTop: "none",
                borderBottom: "1px solid var(--border)",
                borderLeft: c.unreadCount > 0 ? "3px solid #dc2626" : "3px solid transparent",
                borderRight: "none",
                background: c.id === activeId ? "var(--primary-soft)"
                  : hoveredConvId === c.id ? "var(--cream)"
                  : c.unreadCount > 0 ? "#fff7ee" : "white",
                transition: "background 0.12s ease",
              }}
            >
              {c.otherPartyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.otherPartyLogo} alt={c.otherPartyName} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: "var(--cream)", display: "grid", placeItems: "center",
                  fontSize: 15, fontWeight: 800, color: "var(--text-muted)",
                }}>
                  {c.otherPartyName.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                  <span style={{
                    fontSize: 14, fontWeight: c.unreadCount > 0 ? 800 : 600, color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {c.otherPartyName}
                  </span>
                  {c.lastMessage && <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>{fmtVN(c.lastMessage.createdAt)}</span>}
                </div>
                {c.lastMessage && (
                  <div style={{
                    fontSize: 12, color: c.unreadCount > 0 ? "var(--text)" : "var(--text-muted)", fontWeight: c.unreadCount > 0 ? 600 : 400,
                    marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {c.lastMessage.body}
                  </div>
                )}
              </div>
              {c.unreadCount > 0 && (
                <span style={{
                  minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999,
                  background: "#dc2626", color: "white", fontSize: 10, fontWeight: 700,
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}>
                  {c.unreadCount > 9 ? "9+" : c.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* ── RIGHT: thread ── */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {active ? (
          <>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              {active.otherPartyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.otherPartyLogo} alt={active.otherPartyName} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "var(--cream)",
                  display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, color: "var(--text-muted)",
                }}>
                  {active.otherPartyName.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{active.otherPartyName}</div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ChatThread conversationId={active.id} onRead={load} />
            </div>
          </>
        ) : (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", fontSize: 15, padding: 40 }}>
            {conversations && conversations.length > 0 ? "Chọn một cuộc trò chuyện để bắt đầu" : emptyText}
          </div>
        )}
      </div>
    </div>
  );
}
