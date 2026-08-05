"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";

export default function AdminSearch({ placeholder, defaultValue }: { placeholder: string; defaultValue: string }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const inputRef     = useRef<HTMLInputElement>(null);

  function search() {
    const q = inputRef.current?.value.trim() ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{
          flex: 1, padding: "10px 14px", borderRadius: 10,
          border: "1px solid #e5d5c8", fontSize: 16,
          outline: "none", background: "#ffffff", color: "#3d2f1f",
        }}
        onKeyDown={(e) => e.key === "Enter" && search()}
      />
      <button onClick={search} style={{
        padding: "10px 20px", borderRadius: 10,
        background: "#b87c52", color: "white",
        border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer",
      }}>
        Tìm
      </button>
    </div>
  );
}
