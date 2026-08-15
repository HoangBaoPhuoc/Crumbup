"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationToast, { type ToastItem } from "./NotificationToast";
import { CHAT_PANEL_BOTTOM } from "@/components/chat/ChatBubble";
import { useNotifications } from "@/components/notifications/NotificationsProvider";

export default function NotificationListener() {
  const router = useRouter();
  const { loggedIn, isBusiness, notifications } = useNotifications();
  const [toasts, setToasts]     = useState<ToastItem[]>([]);
  const seenIds       = useRef<Set<string>>(new Set());
  const hasBaseline    = useRef(false);

  useEffect(() => {
    if (!loggedIn) {
      setToasts([]);
      seenIds.current.clear();
      hasBaseline.current = false;
    }
  }, [loggedIn]);

  // NotificationsProvider refreshes `notifications` on its own poll/realtime
  // cadence — diff against what we've already shown to pop toasts for new ones.
  useEffect(() => {
    if (!loggedIn) return;
    const list = notifications;

    if (!hasBaseline.current) {
      // First list after mount/login just establishes the baseline — don't pop
      // toasts for notifications that were already unread before we started watching.
      list.forEach((n) => seenIds.current.add(n.id));
      hasBaseline.current = true;
      return;
    }

    const fresh = list.filter((n) => !seenIds.current.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => seenIds.current.add(n.id));
    setToasts((t) => [...fresh, ...t].slice(0, 4));
  }, [notifications, loggedIn]);

  function dismiss(id: string) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  function open(item: ToastItem) {
    dismiss(item.id);
    fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
    router.push(isBusiness ? "/partner?tab=messages" : "/messages");
  }

  if (!loggedIn || toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: CHAT_PANEL_BOTTOM, right: 20, zIndex: 10000,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {toasts.map((t) => (
        <NotificationToast key={t.id} item={t} onOpen={() => open(t)} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
