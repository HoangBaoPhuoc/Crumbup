"use client";

import { useRouter, usePathname } from "next/navigation";

export default function DatePicker({ currentDate }: { currentDate: string }) {
  const router   = useRouter();
  const pathname = usePathname();

  function go(offset: number) {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    router.push(`${pathname}?date=${d.toISOString().slice(0, 10)}`);
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) router.push(`${pathname}?date=${e.target.value}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => go(-1)} style={navBtn}>← Hôm trước</button>
      <input
        type="date"
        defaultValue={currentDate}
        onChange={onInput}
        style={{
          padding: "8px 12px", borderRadius: 10,
          border: "1px solid #e5d5c8", fontSize: 15,
          outline: "none", background: "#ffffff", color: "#3d2f1f", cursor: "pointer",
        }}
      />
      <button onClick={() => go(1)} style={navBtn}>Hôm sau →</button>
      {currentDate !== today && (
        <a href={pathname} style={{ ...navBtn, textDecoration: "none", color: "#b87c52", borderColor: "#e8d7c1" }}>
          Hôm nay
        </a>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 10, background: "#ffffff",
  border: "1px solid #e5d5c8", fontSize: 15, fontWeight: 600,
  color: "#3d2f1f", cursor: "pointer",
};
