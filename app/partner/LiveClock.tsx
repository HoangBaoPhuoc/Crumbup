"use client";

import { useEffect, useState } from "react";

const VN_TZ = "Asia/Ho_Chi_Minh";

export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const weekday = now.toLocaleDateString("vi-VN", { weekday: "long", timeZone: VN_TZ });
  const dateStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: VN_TZ });
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: VN_TZ });

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "7px 14px", borderRadius: 10,
      background: "var(--cream)", border: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>
        {weekday}, {dateStr}
      </span>
      <span style={{ width: 1, height: 14, background: "var(--border-strong)" }} />
      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
        {timeStr}
      </span>
    </div>
  );
}
