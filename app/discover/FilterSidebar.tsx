"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FOOD_CATEGORIES } from "@/lib/utils";

const PRICE_OPTIONS = [
  { label: "Dưới 50.000đ",  value: "low"  },
  { label: "50.000 – 100.000đ", value: "mid"  },
  { label: "100.000 – 150.000đ", value: "high" },
];

const PICKUP_OPTIONS = [
  { label: "Trong 2 giờ tới", value: "soon" },
];

const CATEGORY_OPTIONS = FOOD_CATEGORIES.map((c) => ({ label: `${c.emoji} ${c.label}`, value: c.value }));

export default function FilterSidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const prices     = params.getAll("price");
  const pickups    = params.getAll("pickup");
  const categories = params.getAll("category");
  const sort       = params.get("sort") ?? "default";

  function toggle(key: string, value: string) {
    const next     = new URLSearchParams(params.toString());
    const existing = next.getAll(key);
    next.delete(key);
    if (existing.includes(value)) {
      existing.filter((v) => v !== value).forEach((v) => next.append(key, v));
    } else {
      [...existing, value].forEach((v) => next.append(key, v));
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  function reset() {
    router.push(`${pathname}?sort=${sort}`);
  }

  const hasFilters = prices.length > 0 || pickups.length > 0 || categories.length > 0;

  return (
    <aside className="rise rise-3" style={{
      background: "white", padding: 24, borderRadius: 20,
      border: "1px solid var(--border)", position: "sticky", top: 130,
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 16, margin: 0 }}>Bộ lọc</h3>
        {hasFilters && (
          <button onClick={reset} style={{
            fontSize: 11, fontWeight: 600, color: "var(--primary)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Loại đồ ăn */}
      <FilterGroup
        title="Loại đồ ăn"
        options={CATEGORY_OPTIONS}
        selected={categories}
        onToggle={(v) => toggle("category", v)}
      />

      {/* Khoảng giá */}
      <FilterGroup
        title="Khoảng giá"
        options={PRICE_OPTIONS}
        selected={prices}
        onToggle={(v) => toggle("price", v)}
      />

      {/* Giờ nhận */}
      <FilterGroup
        title="Giờ nhận"
        options={PICKUP_OPTIONS}
        selected={pickups}
        onToggle={(v) => toggle("pickup", v)}
      />
    </aside>
  );
}

function FilterGroup({
  title, options, selected, onToggle,
}: {
  title: string;
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{title}</div>
      {options.map((o) => (
        <label key={o.value} style={{
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 12, padding: "5px 0", cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={selected.includes(o.value)}
            onChange={() => onToggle(o.value)}
            style={{ width: 15, height: 15, accentColor: "var(--primary)", cursor: "pointer" }}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
