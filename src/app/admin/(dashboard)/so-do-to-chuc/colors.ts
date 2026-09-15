// Fixed presets (matching the reference org chart's palette) rather than a
// free-form color input — keeps every box visually consistent instead of
// accumulating a random assortment of near-identical shades over time.
export const NODE_COLOR_PRESETS = [
  "#ede9fe", // purple — top-level (Ban Giám đốc)
  "#2f6b4f", // dark green — department
  "#c9a227", // gold — department
  "#eef2ff", // light — team / leaf box
  "#1d4ed8", // blue
  "#b91c1c", // red
] as const;

// Derives readable text color from a background hex — avoids persisting a
// second "text color" column just to keep the two in sync by hand.
export function contrastText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e1b2e" : "#ffffff";
}
