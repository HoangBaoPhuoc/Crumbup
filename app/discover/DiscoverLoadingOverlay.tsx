"use client";

import { useDiscoverNav } from "./DiscoverNavContext";

export default function DiscoverLoadingOverlay() {
  const { isPending } = useDiscoverNav();

  if (!isPending) return null;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 5,
      background: "rgba(255,255,255,0.6)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 48, pointerEvents: "none",
      transition: "opacity 0.15s ease",
    }}>
      <span style={{
        width: 26, height: 26, border: "3px solid var(--border)",
        borderTopColor: "var(--primary)", borderRadius: "50%",
        display: "inline-block", animation: "spin 0.7s linear infinite",
      }} />
    </div>
  );
}
