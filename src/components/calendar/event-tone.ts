import type { CSSProperties } from "react";

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "");
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

/** Light fill, matching border, black type — used on week calendars. */
export function calendarEventStyle(hex: string, selected = false): CSSProperties {
  const { r, g, b } = hexToRgb(hex);
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.18)`,
    border: `1px solid rgba(${r}, ${g}, ${b}, 0.5)`,
    color: "#111827",
    boxShadow: selected ? `0 0 0 2px rgba(${r}, ${g}, ${b}, 0.85)` : undefined,
  };
}
