"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { INDUSTRY_OPTIONS, type CategoryOption } from "@/lib/utils";
import { useDiscoverNav } from "./DiscoverNavContext";

const PRICE_OPTIONS = [
  { label: "Dưới 50.000đ",  value: "low"  },
  { label: "50.000 – 100.000đ", value: "mid"  },
  { label: "100.000 – 150.000đ", value: "high" },
];

const PICKUP_OPTIONS = [
  { label: "Trong 2 giờ tới", value: "soon" },
];

type FilterKey = "price" | "pickup" | "category";

export default function FilterSidebar({ categoryOptions }: { categoryOptions: CategoryOption[] }) {
  const pathname = usePathname();
  const params   = useSearchParams();
  const { navigate, isPending } = useDiscoverNav();

  const sort = params.get("sort") ?? "default";

  // Group categories by industry (real DB-backed grouping, one group per industry
  // that actually has categories); universal ones (industry = null, e.g. "Khác") stay flat.
  const categoryGroups = INDUSTRY_OPTIONS
    .map((ind) => ({ title: ind.label, options: categoryOptions.filter((c) => c.industry === ind.value) }))
    .filter((g) => g.options.length > 0);
  const flatCategoryOptions = categoryOptions.filter((c) => !c.industry);

  // Local optimistic state — ticks instantly on click, then re-syncs once the
  // real navigation lands (useSearchParams only updates after the RSC round-trip).
  const [prices, setPrices]         = useState(() => params.getAll("price"));
  const [pickups, setPickups]       = useState(() => params.getAll("pickup"));
  const [categories, setCategories] = useState(() => params.getAll("category"));
  // Groups default to open — collapsing is a manual, per-session choice.
  const [openGroups, setOpenGroups] = useState(() => new Set<string>(categoryGroups.map((g) => g.title)));

  function toggleGroup(title: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  const searchKey = params.toString();
  useEffect(() => {
    setPrices(params.getAll("price"));
    setPickups(params.getAll("pickup"));
    setCategories(params.getAll("category"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  function toggle(key: FilterKey, value: string) {
    const current = key === "price" ? prices : key === "pickup" ? pickups : categories;
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

    if (key === "price") setPrices(next);
    else if (key === "pickup") setPickups(next);
    else setCategories(next);

    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete(key);
    next.forEach((v) => nextParams.append(key, v));
    navigate(`${pathname}?${nextParams.toString()}`);
  }

  function reset() {
    setPrices([]);
    setPickups([]);
    setCategories([]);
    navigate(`${pathname}?sort=${sort}`);
  }

  const hasFilters = prices.length > 0 || pickups.length > 0 || categories.length > 0;

  return (
    <aside className="rise rise-3" style={{
      background: "white", padding: 24, borderRadius: 20,
      border: "1px solid var(--border)", position: "sticky", top: 89,
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ fontSize: 18, margin: 0 }}>Bộ lọc</h3>
          {isPending && (
            <span style={{
              width: 12, height: 12, border: "2px solid var(--border)",
              borderTopColor: "var(--primary)", borderRadius: "50%",
              display: "inline-block", animation: "spin 0.7s linear infinite",
            }} />
          )}
        </div>
        {hasFilters && (
          <button onClick={reset} style={{
            fontSize: 11, fontWeight: 600, color: "var(--primary)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Ngành hàng */}
      <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Ngành hàng</div>

        {categoryGroups.map((group) => {
          const isOpen = openGroups.has(group.title);
          return (
            <div key={group.title}>
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  fontSize: 12, fontWeight: 600, padding: "5px 0", marginBottom: isOpen ? 2 : 0,
                  background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "var(--text)",
                }}
              >
                <span style={{
                  display: "inline-block", fontSize: 9, color: "var(--text-muted)",
                  transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}>
                  ▶
                </span>
                {group.title}
              </button>
              {isOpen && (
                <div style={{ paddingLeft: 18, marginBottom: 4 }}>
                  {group.options.map((o) => (
                    <CheckboxRow key={o.id} label={o.label} checked={categories.includes(o.id)} onChange={() => toggle("category", o.id)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {flatCategoryOptions.map((o) => (
          <CheckboxRow key={o.id} label={o.label} checked={categories.includes(o.id)} onChange={() => toggle("category", o.id)} />
        ))}
      </div>

      {/* Khoảng giá */}
      <FilterGroup
        title="Khoảng giá"
        options={PRICE_OPTIONS}
        selected={prices}
        onToggle={(v) => toggle("price", v)}
      />

      {/* Giờ nhận */}
      <FilterGroup
        title="Thời gian mở bán"
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
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{title}</div>
      {options.map((o) => (
        <CheckboxRow key={o.value} label={o.label} checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
      ))}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      fontSize: 12, padding: "5px 0", cursor: "pointer",
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1, accentColor: "var(--primary)", cursor: "pointer" }}
      />
      {label}
    </label>
  );
}
