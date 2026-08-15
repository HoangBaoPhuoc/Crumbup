"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  ACCEPT_ATTR, MAX_ATTACHMENTS_PER_MESSAGE, MAX_IMAGE_MB, MAX_FILE_MB,
  classifyPickedFile, extOf, formatBytes, maxBytesFor,
  type AttachmentKind, type ChatAttachment,
} from "@/lib/chatAttachments";

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  // Legacy single-attachment fields — populated on messages sent before
  // multi-attachment support; new messages use `attachments` instead.
  attachmentUrl: string | null;
  attachmentType: "image" | "file" | null;
  attachmentName: string | null;
  attachments: ChatAttachment[] | null;
  pending?: boolean;
  failed?: boolean;
};

type StagedAttachment = {
  localId: string;
  file: File;
  type: AttachmentKind;
  previewUrl?: string;
};

const NEAR_BOTTOM_PX = 80;
// Compact grid like Messenger: show at most this many tiles, "+N" overlay
// on the last one for the rest — click any tile to browse the full set.
const MAX_VISIBLE_IMAGES = 4;
// Compose box grows with the message up to this height (~5 lines), then
// scrolls internally instead of pushing the rest of the layout down.
const MAX_COMPOSE_HEIGHT = 110;

// Realtime broadcast delivers new messages/read-receipts instantly; polling
// is just a safety net in case the websocket silently drops.
const POLL_MS = 30_000;
const BUCKET = "box-images";

type BroadcastMessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachmentUrl: string | null;
  attachmentType: "image" | "file" | null;
  attachmentName: string | null;
  attachments: ChatAttachment[] | null;
  readAt: string | null;
  createdAt: string;
};

// Normalizes a message's attachment(s) into one array regardless of whether
// it used the legacy single-attachment columns or the new JSON array.
function attachmentsOf(m: Message): ChatAttachment[] {
  if (m.attachments && m.attachments.length > 0) return m.attachments;
  if (m.attachmentUrl && m.attachmentType) {
    return [{
      url: m.attachmentUrl, type: m.attachmentType,
      name: m.attachmentName ?? (m.attachmentType === "image" ? "Hình ảnh" : "Tệp đính kèm"),
      size: 0,
    }];
  }
  return [];
}

function Avatar({ url, label }: { url: string | null; label: string }) {
  const initial = label.trim().charAt(0).toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={label} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
      background: "var(--cream)", border: "1px solid var(--border)",
      display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, color: "var(--text-muted)",
    }}>
      {initial || (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.8-3.6-5-8-5Z" />
        </svg>
      )}
    </div>
  );
}

function fmtTime(iso: string) {
  const d = new Date(new Date(iso).getTime() + 7 * 60 * 60_000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default function ChatThread({
  conversationId, onMeta, onRead,
}: {
  conversationId: string;
  onMeta?: (otherPartyName: string) => void;
  onRead?: () => void;
}) {
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [currentUserId, setCurrentUserId]         = useState("");
  const [otherPartyName, setOtherPartyName]       = useState("");
  const [otherPartyAvatar, setOtherPartyAvatar]   = useState<string | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [draft, setDraft]         = useState("");
  const [sending, setSending]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [staged, setStaged]       = useState<StagedAttachment[]>([]);
  const [lightbox, setLightbox]   = useState<{ images: ChatAttachment[]; index: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const draftRef  = useRef<HTMLTextAreaElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Auto-grow the compose box with the message, capped at MAX_COMPOSE_HEIGHT —
  // beyond that it scrolls internally instead of expanding forever.
  useEffect(() => {
    const el = draftRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSE_HEIGHT)}px`;
  }, [draft]);

  function trackObjectUrl(url: string) {
    objectUrlsRef.current.add(url);
    return url;
  }
  function releaseObjectUrl(url?: string) {
    if (!url) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  }

  // Switching conversations shouldn't carry over files staged for a
  // different chat, and their object URLs must be released to avoid leaks.
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current.clear();
      setStaged([]);
      setDraft("");
    };
  }, [conversationId]);
  // Whether the viewport was scrolled near the bottom right before the last
  // update — drives whether we auto-scroll. Without this, a background poll
  // would yank you back to the bottom even while reading older messages.
  const nearBottomRef = useRef(true);
  // Latest-ref pattern: callers pass fresh onRead/currentUserId closures each
  // render, but the realtime subscription effect below only wants to (re)run
  // when conversationId changes — read these through refs instead.
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }

  async function load(showSpinner: boolean) {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lỗi tải tin nhắn"); return; }
      setCurrentUserId(data.currentUserId);
      setOtherPartyName(data.otherPartyName ?? "");
      setOtherPartyAvatar(data.otherPartyAvatar ?? null);
      // Keep any still-pending optimistic messages that the server doesn't know about yet.
      setMessages((prev) => {
        const pending = prev.filter((m) => m.pending);
        return pending.length ? [...data.messages, ...pending] : data.messages;
      });
      onMeta?.(data.otherPartyName);
      setError("");
    } catch {
      setError("Lỗi kết nối");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    fetch(`/api/conversations/${conversationId}/messages/read`, { method: "POST" })
      .then((res) => { if (res.ok) onRead?.(); });
    const id = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Private channel authorized by the RLS policy on realtime.messages — see
  // prisma/sql/realtime-broadcast.sql. Delivers new messages and read
  // receipts instantly instead of waiting for the next poll.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`conversation:${conversationId}`, { config: { private: true } });

    channel
      .on("broadcast", { event: "INSERT" }, (msg) => {
        const record = (msg.payload as { record?: BroadcastMessageRow }).record;
        if (!record) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === record.id)) return prev;
          if (record.senderId === currentUserIdRef.current) return prev;
          return [...prev, { ...record, pending: false, failed: false }];
        });
        if (record.senderId !== currentUserIdRef.current && nearBottomRef.current) {
          fetch(`/api/conversations/${conversationId}/messages/read`, { method: "POST" })
            .then((res) => { if (res.ok) onReadRef.current?.(); });
        }
      })
      .on("broadcast", { event: "UPDATE" }, (msg) => {
        const record = (msg.payload as { record?: BroadcastMessageRow }).record;
        if (!record) return;
        setMessages((prev) => prev.map((m) => m.id === record.id ? { ...m, readAt: record.readAt } : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    if (!nearBottomRef.current) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft") setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb);
      else if (e.key === "ArrowRight") setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // Files are only staged (previewed locally) when picked — nothing uploads
  // or sends until the user hits Gửi, optionally together with typed text.
  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = "";
    if (files.length === 0) return;

    const accepted: StagedAttachment[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (staged.length + accepted.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
        rejected.push(`${file.name} (quá ${MAX_ATTACHMENTS_PER_MESSAGE} tệp)`);
        continue;
      }
      const type = classifyPickedFile(file);
      if (!type) { rejected.push(`${file.name} (định dạng không hỗ trợ)`); continue; }
      if (file.size > maxBytesFor(type)) {
        rejected.push(`${file.name} (quá ${type === "image" ? MAX_IMAGE_MB : MAX_FILE_MB}MB)`);
        continue;
      }
      accepted.push({
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        type,
        previewUrl: type === "image" ? trackObjectUrl(URL.createObjectURL(file)) : undefined,
      });
    }

    if (accepted.length) setStaged((s) => [...s, ...accepted]);
    setError(rejected.length ? `Không thể thêm: ${rejected.join(", ")}` : "");
  }

  function removeStaged(localId: string) {
    setStaged((s) => {
      const found = s.find((x) => x.localId === localId);
      releaseObjectUrl(found?.previewUrl);
      return s.filter((x) => x.localId !== localId);
    });
  }

  async function send() {
    const text = draft.trim();
    if ((!text && staged.length === 0) || sending || uploading) return;

    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticAttachments: ChatAttachment[] = staged.map((s) => ({
      url: s.previewUrl ?? "", type: s.type, name: s.file.name, size: s.file.size,
    }));
    const optimistic: Message = {
      id: tempId, senderId: currentUserId, body: text, createdAt: new Date().toISOString(), readAt: null,
      attachmentUrl: null, attachmentType: null, attachmentName: null,
      attachments: optimisticAttachments.length ? optimisticAttachments : null,
      pending: true,
    };

    const filesToUpload = staged;
    nearBottomRef.current = true;
    setMessages((m) => [...m, optimistic]);
    setStaged([]);
    setDraft("");
    setSending(true);
    setError("");

    try {
      let uploaded: ChatAttachment[] = [];
      if (filesToUpload.length > 0) {
        setUploading(true);
        const supabase = createClient();
        uploaded = await Promise.all(filesToUpload.map(async (s) => {
          const ext  = extOf(s.file.name) || "bin";
          const path = `chat/${conversationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, s.file, { upsert: false });
          if (upErr) throw new Error(upErr.message);
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
          return { url: data.publicUrl, type: s.type, name: s.file.name, size: s.file.size };
        }));
        setUploading(false);
      }

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text || undefined, attachments: uploaded.length ? uploaded : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => m.map((msg) => msg.id === tempId ? { ...msg, pending: false, failed: true } : msg));
        setError(data.error ?? "Lỗi gửi tin nhắn");
        return;
      }
      setMessages((m) => m.map((msg) => msg.id === tempId ? data.message : msg));
    } catch (err) {
      setMessages((m) => m.map((msg) => msg.id === tempId ? { ...msg, pending: false, failed: true } : msg));
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setSending(false);
      setUploading(false);
      filesToUpload.forEach((s) => releaseObjectUrl(s.previewUrl));
    }
  }

  const busy = sending || uploading;
  const lastOwnMessage = [...messages].reverse().find((m) => m.senderId === currentUserId) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ margin: "auto", color: "var(--text-muted)", fontSize: 14 }}>Đang tải...</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            Chưa có tin nhắn nào.<br />Nhắn để liên hệ khi cần nhé.
          </div>
        ) : (
          messages.map((m, idx) => {
            const own = m.senderId === currentUserId;
            const atts = attachmentsOf(m);
            const images = atts.filter((a) => a.type === "image");
            const files  = atts.filter((a) => a.type === "file");
            // Messenger convention: only the other party gets an avatar, shown
            // once at the bottom of each run of consecutive messages from
            // them (not on every single bubble, not on your own messages).
            const nextMsg = messages[idx + 1];
            const showAvatar = !own && (!nextMsg || nextMsg.senderId !== m.senderId);
            return (
              <div key={m.id} style={{
                display: "flex", justifyContent: own ? "flex-end" : "flex-start",
                alignItems: "flex-end", gap: 6,
                opacity: m.pending ? 0.6 : 1, transition: "opacity 0.15s ease",
              }}>
                {!own && (showAvatar ? <Avatar url={otherPartyAvatar} label={otherPartyName} /> : <div style={{ width: 26, flexShrink: 0 }} />)}
                <div style={{ maxWidth: "78%" }}>
                  {images.length > 0 && (
                    <div style={{
                      display: "flex", flexWrap: "wrap", gap: 4,
                      marginBottom: (m.body || files.length) ? 4 : 0,
                    }}>
                      {images.slice(0, MAX_VISIBLE_IMAGES).map((img, idx) => {
                        const hiddenCount = images.length - MAX_VISIBLE_IMAGES;
                        const showMoreOverlay = idx === MAX_VISIBLE_IMAGES - 1 && hiddenCount > 0;
                        return (
                          <button
                            key={idx}
                            onClick={() => setLightbox({ images, index: idx })}
                            style={{ position: "relative", padding: 0, border: "none", background: "none", cursor: "pointer", lineHeight: 0 }}
                            title={showMoreOverlay ? `+${hiddenCount} ảnh khác` : img.name}
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              style={{
                                width: images.length > 1 ? 90 : "auto", height: images.length > 1 ? 90 : "auto",
                                maxWidth: "100%", maxHeight: images.length > 1 ? 90 : 220,
                                borderRadius: 12, display: "block", objectFit: "cover",
                                border: "1px solid var(--border)",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                                filter: showMoreOverlay ? "brightness(0.55)" : undefined,
                              }}
                            />
                            {showMoreOverlay && (
                              <span style={{
                                position: "absolute", inset: 0, display: "grid", placeItems: "center",
                                color: "white", fontSize: 17, fontWeight: 800,
                              }}>
                                +{hiddenCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {files.map((f, idx) => (
                    <a
                      key={idx}
                      href={f.url} download={f.name} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 12,
                        background: own ? "var(--primary-dark)" : "var(--cream)", border: own ? "none" : "1px solid var(--border)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        color: own ? "white" : "var(--primary)", fontSize: 13, fontWeight: 600, textDecoration: "none",
                        marginBottom: (m.body || idx < files.length - 1) ? 4 : 0,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.41 17.41a1.5 1.5 0 0 1-2.12-2.12l8.49-8.49" />
                      </svg>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      {f.size > 0 && <span style={{ opacity: 0.75, flexShrink: 0 }}>{formatBytes(f.size)}</span>}
                    </a>
                  ))}
                  {m.body && (
                    <div style={{
                      padding: "9px 13px", borderRadius: 14,
                      borderBottomRightRadius: own ? 4 : 14, borderBottomLeftRadius: own ? 14 : 4,
                      background: own ? "var(--primary)" : "var(--cream)",
                      border: own ? "none" : "1px solid var(--border)",
                      boxShadow: own ? "0 1px 3px rgba(134,21,25,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
                      color: own ? "white" : "var(--text)",
                      fontSize: 14, lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>
                      {m.body}
                    </div>
                  )}
                  <div style={{
                    fontSize: 10, color: m.failed ? "#dc2626" : "var(--text-muted)", marginTop: 3,
                    textAlign: own ? "right" : "left",
                  }}>
                    {m.failed ? "Gửi thất bại" : m.pending ? "Đang gửi..." : fmtTime(m.createdAt)}
                  </div>
                  {own && m.readAt && m.id === lastOwnMessage?.id && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1, textAlign: "right" }}>
                      Đã xem lúc {fmtTime(m.readAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div style={{ padding: "8px 20px", fontSize: 12, color: "#b91c1c", background: "#fef2f2", flexShrink: 0 }}>
          {error}
        </div>
      )}

      {staged.length > 0 && (
        <div style={{
          display: "flex", gap: 8, padding: "10px 14px 0", flexShrink: 0,
          overflowX: "auto",
        }}>
          {staged.map((s) => (
            <div key={s.localId} style={{ position: "relative", flexShrink: 0 }}>
              {s.type === "image" ? (
                <img
                  src={s.previewUrl} alt={s.file.name}
                  style={{
                    width: 56, height: 56, borderRadius: 10, objectFit: "cover", display: "block",
                    border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 10, border: "1px solid var(--border)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 2, padding: 4,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.41 17.41a1.5 1.5 0 0 1-2.12-2.12l8.49-8.49" />
                  </svg>
                  <span style={{ fontSize: 8, color: "var(--text-muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                    {s.file.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeStaged(s.localId)}
                disabled={busy}
                title="Bỏ tệp này"
                style={{
                  position: "absolute", top: -6, right: -6,
                  width: 18, height: 18, borderRadius: "50%", border: "1.5px solid white",
                  background: "#dc2626", color: "white", fontSize: 10, lineHeight: 1,
                  cursor: busy ? "not-allowed" : "pointer", display: "grid", placeItems: "center", padding: 0,
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexShrink: 0, alignItems: "flex-end" }}>
        <input ref={fileRef} type="file" multiple onChange={handleFilesSelected} style={{ display: "none" }} accept={ACCEPT_ATTR} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title="Đính kèm ảnh/tệp"
          style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            border: "1px solid var(--border)", background: "white", color: "var(--text-muted)",
            cursor: busy ? "not-allowed" : "pointer", display: "grid", placeItems: "center",
          }}
        >
          {uploading ? (
            <span style={{ fontSize: 10, fontWeight: 700 }}>...</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.41 17.41a1.5 1.5 0 0 1-2.12-2.12l8.49-8.49" />
            </svg>
          )}
        </button>
        <textarea
          ref={draftRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Nhập tin nhắn..."
          disabled={busy}
          rows={1}
          style={{
            flex: 1, padding: "9px 14px", borderRadius: 18,
            border: "1px solid var(--border)", outline: "none", fontSize: 14, background: "var(--ivory)",
            fontFamily: "inherit", lineHeight: 1.4, resize: "none",
            maxHeight: MAX_COMPOSE_HEIGHT, overflowY: "auto",
          }}
        />
        <button
          onClick={send}
          disabled={busy || (!draft.trim() && staged.length === 0)}
          style={{
            padding: "0 20px", height: 36, borderRadius: 999, border: "none", flexShrink: 0,
            background: busy || (!draft.trim() && staged.length === 0) ? "var(--primary-soft)" : "var(--primary)",
            color: busy || (!draft.trim() && staged.length === 0) ? "var(--primary)" : "white",
            fontWeight: 700, fontSize: 14, cursor: busy || (!draft.trim() && staged.length === 0) ? "not-allowed" : "pointer",
          }}
        >
          Gửi
        </button>
      </div>

      {lightbox && typeof document !== "undefined" && createPortal(
        // Portal straight to <body> — ChatThread can be embedded inside the
        // ChatBubble panel, which has a `transform`-based open animation.
        // Any transformed ancestor becomes a containing block for
        // `position: fixed`, which would trap the lightbox inside the small
        // chat panel instead of covering the full screen.
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 10050,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "zoom-out",
          }}
        >
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb); }}
              aria-label="Ảnh trước"
              style={{
                position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.15)", color: "white", fontSize: 22, cursor: "pointer",
                display: "grid", placeItems: "center",
              }}
            >‹</button>
          )}
          <img
            src={lightbox.images[lightbox.index].url} alt={lightbox.images[lightbox.index].name}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "78vh", borderRadius: 8, objectFit: "contain", cursor: "default" }}
          />
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb); }}
              aria-label="Ảnh sau"
              style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.15)", color: "white", fontSize: 22, cursor: "pointer",
                display: "grid", placeItems: "center",
              }}
            >›</button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }} onClick={(e) => e.stopPropagation()}>
            {lightbox.images.length > 1 && (
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700 }}>
                {lightbox.index + 1}/{lightbox.images.length}
              </span>
            )}
            <a
              href={lightbox.images[lightbox.index].url} download={lightbox.images[lightbox.index].name} target="_blank" rel="noopener noreferrer"
              style={{
                padding: "8px 18px", borderRadius: 999, background: "white", color: "var(--text)",
                fontWeight: 700, fontSize: 13, textDecoration: "none",
              }}
            >
              Tải về
            </a>
            <button
              onClick={() => setLightbox(null)}
              style={{
                padding: "8px 18px", borderRadius: 999, background: "rgba(255,255,255,0.15)",
                color: "white", border: "1px solid rgba(255,255,255,0.35)", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
