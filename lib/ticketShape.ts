// Real geometry, not a color-matching illusion: builds an SVG path for a
// rounded rect with actual semicircle notches cut into the left edge (like a
// torn voucher stub), so whatever sits behind a card — page background, a
// neighboring card's shadow, anything — shows through correctly wherever
// it's used as a clip-path, instead of relying on a painted circle matching
// an assumed background color.
export function buildTicketClipPath(width: number, height: number, r: number, notchR: number, notchCount: number): string {
  const usableStart = r;
  const usableEnd = height - r;
  const usableHeight = usableEnd - usableStart;
  const notchYs = Array.from({ length: notchCount }, (_, i) => usableStart + ((i + 0.5) / notchCount) * usableHeight);

  let d = `M ${r},0 L ${width - r},0 A ${r},${r} 0 0 1 ${width},${r} `
    + `L ${width},${height - r} A ${r},${r} 0 0 1 ${width - r},${height} `
    + `L ${r},${height} A ${r},${r} 0 0 1 0,${height - r} `;

  // Walk up the left edge bottom-to-top, cutting a semicircle at each notch.
  for (const cy of [...notchYs].reverse()) {
    d += `L 0,${cy + notchR} A ${notchR},${notchR} 0 0 0 0,${cy - notchR} `;
  }

  d += `L 0,${r} A ${r},${r} 0 0 1 ${r},0 Z`;
  return d;
}
