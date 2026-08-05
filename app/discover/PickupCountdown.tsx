"use client";

import { useEffect, useState } from "react";

function vnNowMinutes(): number {
  const now = new Date();
  const vn = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return vn.getHours() * 60 + vn.getMinutes();
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

function fmtDiff(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
  if (h > 0) return `${h} giờ`;
  return `${m} phút`;
}

export default function PickupCountdown({ pickupStart, pickupEnd }: { pickupStart: string; pickupEnd: string }) {
  const [now, setNow] = useState(vnNowMinutes);

  useEffect(() => {
    const id = setInterval(() => setNow(vnNowMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);

  const start = parseHHMM(pickupStart);
  const end   = parseHHMM(pickupEnd);

  if (now < start) {
    const diff = start - now;
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        background: "var(--cream)", borderRadius: 12, padding: "8px 12px",
        minWidth: 90, textAlign: "center",
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Nhận hàng sau</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{fmtDiff(diff)}</span>
      </div>
    );
  }

  if (now <= end) {
    const diff = end - now;
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        background: "var(--accent-soft)", borderRadius: 12, padding: "8px 12px",
        minWidth: 90, textAlign: "center",
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Đang mở • còn</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>{fmtDiff(diff)}</span>
      </div>
    );
  }

  // After pickup window
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: "#f1f5f9", borderRadius: 12, padding: "8px 12px",
      minWidth: 90, textAlign: "center",
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Đã kết thúc</span>
      <span style={{ fontSize: 17, fontWeight: 900, color: "#94a3b8", lineHeight: 1 }}>{pickupStart}–{pickupEnd}</span>
    </div>
  );
}
