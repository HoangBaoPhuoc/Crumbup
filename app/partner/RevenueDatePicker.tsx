"use client";

import { useRouter } from "next/navigation";

export default function RevenueDatePicker({ value, max }: { value: string; max: string }) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value;
    if (!date) return;
    router.push(`/partner?tab=overview&revenueDate=${date}`);
  }

  return (
    <input
      type="date"
      value={value}
      max={max}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      style={{
        padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border)",
        fontSize: 11, outline: "none", background: "var(--ivory)", color: "var(--text-muted)",
        cursor: "pointer",
      }}
    />
  );
}
