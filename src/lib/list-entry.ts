export type ListEntryPriority = "none" | "high" | "medium" | "low";

export const LIST_ENTRY_PRIORITIES: ListEntryPriority[] = [
  "none",
  "high",
  "medium",
  "low",
];

export const LIST_ENTRY_PRIORITY_LABELS: Record<ListEntryPriority, string> = {
  none: "بدون",
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

export function isListEntryPriority(
  value: unknown,
): value is ListEntryPriority {
  return (
    value === "none" ||
    value === "high" ||
    value === "medium" ||
    value === "low"
  );
}

export function resolveListEntryPriority(value: unknown): ListEntryPriority {
  return isListEntryPriority(value) ? value : "none";
}
