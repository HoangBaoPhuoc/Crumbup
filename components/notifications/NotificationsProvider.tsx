"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type NotificationItem = { id: string; type: string; orderId: string | null; title: string; body: string | null };

// Realtime broadcast delivers new notifications instantly; polling is just a
// safety net in case the websocket silently drops.
const POLL_MS = 30_000;

type NotificationsContextValue = {
  loggedIn: boolean;
  isBusiness: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

// Single source of truth for auth state + unread notifications, shared by
// ChatBubble, NotificationListener, the partner Sidebar and OrdersNavLink —
// they used to each poll /api/notifications and listen to auth changes
// independently, which meant 4x the requests and 4x the auth listeners.
export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn]     = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [userId, setUserId]         = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const pathname = usePathname();
  const knownUserIdRef = useRef<string | null | undefined>(undefined);

  function applyUser(user: { id: string; user_metadata?: { role?: string } } | null) {
    knownUserIdRef.current = user?.id ?? null;
    setLoggedIn(!!user);
    setIsBusiness(user?.user_metadata?.role === "BUSINESS");
    setUserId(user?.id ?? null);
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
    }
  }

  // Root layout never remounts on client-side navigation, so a one-shot check
  // here would go stale across login/logout. onAuthStateChange only fires for
  // auth calls made through THIS browser client — login/logout here happen via
  // server routes that set cookies directly, which that listener never sees.
  // Re-checking on every pathname change (login/logout always end in a
  // client-side navigation) is what actually catches those.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      applyUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (knownUserIdRef.current === undefined) return; // initial mount check above already covers this
    const supabase = createClient();
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      if ((user?.id ?? null) !== knownUserIdRef.current) applyUser(user);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unread=1");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
      setNotifications(data.notifications ?? []);
    } catch {
      // transient network error — next poll will retry
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [loggedIn, refresh]);

  // Private channel authorized by the RLS policy on realtime.messages — see
  // prisma/sql/realtime-broadcast.sql. New orders and new chat messages both
  // insert a Notification row, which broadcasts here — just re-fetch on any
  // event instead of trying to reconcile partial state client-side.
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel(`user:${userId}`, { config: { private: true } });
    channel.on("broadcast", { event: "INSERT" }, () => { refresh(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refresh]);

  return (
    <NotificationsContext.Provider value={{ loggedIn, isBusiness, unreadCount, notifications, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}
