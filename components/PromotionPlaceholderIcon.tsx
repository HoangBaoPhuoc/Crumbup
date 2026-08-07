export default function PromotionPlaceholderIcon({ kind, size = 40, style }: { kind: string | null | undefined; size?: number; style?: React.CSSProperties }) {
  if (kind === "STORE_ANNOUNCEMENT") {
    return (
      <svg
        width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={style}
      >
        <path d="M3 11v2a2 2 0 002 2h1l3 5V6l-3 5H5a2 2 0 00-2 2Z" />
        <path d="M13 8a4 4 0 010 8" />
        <path d="M17 5a8 8 0 010 14" />
      </svg>
    );
  }
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={style}
    >
      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8Z" />
      <path d="M10 6v12" strokeDasharray="2 2" />
    </svg>
  );
}
