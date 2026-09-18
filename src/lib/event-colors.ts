/**
 * Full Tailwind default palette (500), red → olive.
 * @see https://tailwindcss.com/docs/colors
 */
export const EVENT_COLOR_PALETTE = [
  { value: "oklch(63.7% 0.237 25.331)", label: "أحمر", key: "red" },
  { value: "oklch(70.5% 0.213 47.604)", label: "برتقالي", key: "orange" },
  { value: "oklch(76.9% 0.188 70.08)", label: "عنبري", key: "amber" },
  { value: "oklch(79.5% 0.184 86.047)", label: "أصفر", key: "yellow" },
  { value: "oklch(76.8% 0.233 130.85)", label: "ليموني", key: "lime" },
  { value: "oklch(72.3% 0.219 149.579)", label: "أخضر", key: "green" },
  { value: "oklch(69.6% 0.17 162.48)", label: "زمردي", key: "emerald" },
  { value: "oklch(70.4% 0.14 182.503)", label: "تركوازي", key: "teal" },
  { value: "oklch(71.5% 0.143 215.221)", label: "سماوي", key: "cyan" },
  { value: "oklch(68.5% 0.169 237.323)", label: "أزرق سماوي", key: "sky" },
  { value: "oklch(62.3% 0.214 259.815)", label: "أزرق", key: "blue" },
  { value: "oklch(58.5% 0.233 277.117)", label: "نيلي", key: "indigo" },
  { value: "oklch(60.6% 0.25 292.717)", label: "بنفسجي", key: "violet" },
  { value: "oklch(62.7% 0.265 303.9)", label: "أرجواني", key: "purple" },
  { value: "oklch(66.7% 0.295 322.15)", label: "فوشيا", key: "fuchsia" },
  { value: "oklch(65.6% 0.241 354.308)", label: "وردي", key: "pink" },
  { value: "oklch(64.5% 0.246 16.439)", label: "وردي غامق", key: "rose" },
  { value: "oklch(55.4% 0.046 257.417)", label: "إردوازي", key: "slate" },
  { value: "oklch(55.1% 0.027 264.364)", label: "رمادي", key: "gray" },
  { value: "oklch(55.2% 0.016 285.938)", label: "زنك", key: "zinc" },
  { value: "oklch(55.6% 0 0)", label: "محايد", key: "neutral" },
  { value: "oklch(55.3% 0.013 58.071)", label: "حجري", key: "stone" },
  { value: "oklch(54.7% 0.021 43.1)", label: "ترابي", key: "taupe" },
  { value: "oklch(54.2% 0.034 322.5)", label: "موف", key: "mauve" },
  { value: "oklch(56% 0.021 213.5)", label: "ضبابي", key: "mist" },
  { value: "oklch(58% 0.031 107.3)", label: "زيتوني", key: "olive" },
] as const;

export type EventColor = (typeof EVENT_COLOR_PALETTE)[number]["value"];

export function isEventColor(value: string): value is EventColor {
  return (EVENT_COLOR_PALETTE as readonly { value: string }[]).some(
    (c) => c.value === value,
  );
}

/** Map a stored value to a palette color, or fall back to default. */
export function resolveEventColor(value: string): EventColor {
  if (isEventColor(value)) return value;
  return DEFAULT_EVENT_COLOR;
}

export const DEFAULT_EVENT_COLOR: EventColor = EVENT_COLOR_PALETTE[10].value; // blue
