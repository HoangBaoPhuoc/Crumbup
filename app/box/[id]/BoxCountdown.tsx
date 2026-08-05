"use client";

import { useEffect, useState } from "react";

function vnNowSec(): number {
  const vn = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return vn.getHours() * 3600 + vn.getMinutes() * 60 + vn.getSeconds();
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 3600 + m * 60;
}

function fmt(totalSec: number): string {
  const h   = Math.floor(totalSec / 3600);
  const m   = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  const mm  = String(m).padStart(2, "0");
  const ss  = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function BoxCountdown({ pickupStart, pickupEnd }: { pickupStart: string; pickupEnd: string }) {
  const [now, setNow] = useState(vnNowSec);

  useEffect(() => {
    const id = setInterval(() => setNow(vnNowSec()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = parseHHMM(pickupStart);
  const end   = parseHHMM(pickupEnd);

  if (now < start) {
    const diff = start - now;
    return (
      <div style={{
        background: "var(--cream)", borderRadius: 16, padding: "18px 20px", textAlign: "center",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Nhận hàng sau
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em", lineHeight: 1 }}>
          {fmt(diff)}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
          Bắt đầu lúc {pickupStart}
        </div>
      </div>
    );
  }

  if (now <= end) {
    const diff = end - now;
    return (
      <div style={{
        background: "var(--accent-soft)", borderRadius: 16, padding: "18px 20px", textAlign: "center",
        border: "1.5px solid var(--accent)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Đang mở · Kết thúc sau
          </span>
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em", lineHeight: 1 }}>
          {fmt(diff)}
        </div>
        <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6, fontWeight: 700 }}>
          Kết thúc lúc {pickupEnd}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#f1f5f9", borderRadius: 16, padding: "18px 20px", textAlign: "center",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        Đã kết thúc
      </div>
      <div style={{ fontSize: 23, fontWeight: 800, color: "#94a3b8" }}>
        {pickupStart} – {pickupEnd}
      </div>
    </div>
  );
}
