"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useDiscoverNav } from "./DiscoverNavContext";

const SORTS = [
  { label: "Mặc định",      value: "default"    },
  { label: "Giá thấp nhất", value: "price_asc"  },
  { label: "Giá cao nhất",  value: "price_desc" },
];

export default function SortButtons({ current }: { current: string }) {
  const pathname = usePathname();
  const params   = useSearchParams();
  const { navigate, isPending } = useDiscoverNav();

  // Local optimistic state so the active button switches instantly on click.
  const [active, setActive] = useState(current);

  const searchKey = params.toString();
  useEffect(() => {
    setActive(params.get("sort") ?? "default");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  function setSort(value: string) {
    setActive(value);
    const next = new URLSearchParams(params.toString());
    next.set("sort", value);
    next.delete("page");
    navigate(`${pathname}?${next.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {SORTS.map((s) => (
        <button
          key={s.value}
          onClick={() => setSort(s.value)}
          className={active === s.value ? "btn btn-primary" : "btn btn-ghost"}
          style={{ fontSize: 12, padding: "8px 14px" }}
        >
          {s.label}
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
