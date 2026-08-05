"use client";

import { useRef, useEffect, ClipboardEvent, KeyboardEvent } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OtpInput({ value, onChange, length = 6, disabled, autoFocus }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, " ").split("").slice(0, length);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  function set(idx: number, char: string) {
    const clean = char.replace(/\D/g, "");
    const next = digits.map((d, i) => (i === idx ? clean.slice(-1) : d === " " ? "" : d)).join("").replace(/ /g, "");
    onChange(next.slice(0, length));
    if (clean && idx < length - 1) inputs.current[idx + 1]?.focus();
  }

  function handleKey(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[idx].trim()) {
        // clear current
        const next = [...digits];
        next[idx] = "";
        onChange(next.join("").replace(/ /g, ""));
      } else if (idx > 0) {
        inputs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {digits.map((d, i) => {
        const filled = d.trim() !== "";
        return (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={filled ? d : ""}
            disabled={disabled}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            style={{
              width: 52,
              height: 60,
              borderRadius: 14,
              border: filled ? "2.5px solid var(--primary)" : "1.5px solid var(--border)",
              fontSize: 30,
              fontWeight: 800,
              textAlign: "center",
              background: filled ? "var(--primary-soft)" : "var(--ivory)",
              outline: "none",
              transition: "border-color 0.15s, background 0.15s",
              color: "var(--text)",
              fontFamily: "var(--font-display)",
              opacity: disabled ? 0.55 : 1,
              cursor: disabled ? "not-allowed" : "text",
            }}
          />
        );
      })}
    </div>
  );
}
