"use client";

export default function WishlistButton() {
  return (
    <button
      style={{
        width: 36, height: 36, borderRadius: 999,
        background: "var(--cream)", display: "grid",
        placeItems: "center", fontSize: 18, border: "none", cursor: "pointer",
      }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      ♡
    </button>
  );
}
