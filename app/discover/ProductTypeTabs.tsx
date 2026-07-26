"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useDiscoverNav } from "./DiscoverNavContext";

const TYPES = [
  { label: "Tất cả",         value: "" },
  { label: "🎁 Surprise Box", value: "SURPRISE_BOX" },
  { label: "🎟️ Voucher",     value: "VOUCHER" },
];

export default function ProductTypeTabs({ current }: { current: string }) {
  const pathname = usePathname();
  const params   = useSearchParams();
  const { navigate, isPending } = useDiscoverNav();

  const [active, setActive] = useState(current);

  const searchKey = params.toString();
  useEffect(() => {
    setActive(params.get("type") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  function setType(value: string) {
    setActive(value);
    const next = new URLSearchParams(params.toString());
    if (value) next.set("type", value);
    else next.delete("type");
    navigate(`${pathname}?${next.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => setType(t.value)}
          className={active === t.value ? "btn btn-primary" : "btn btn-ghost"}
          style={{ fontSize: 12, padding: "8px 14px" }}
        >
          {t.label}
        </button>
      ))}
      {isPending && (
        <span style={{
          width: 13, height: 13, border: "2px solid var(--border)",
          borderTopColor: "var(--primary)", borderRadius: "50%",
          display: "inline-block", animation: "spin 0.7s linear infinite",
        }} />
      )}
    </div>
  );
}
