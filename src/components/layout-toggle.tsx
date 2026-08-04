"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewLayout = "list" | "grid";

export function LayoutToggle({
  value,
  onChange,
}: {
  value: ViewLayout;
  onChange: (value: ViewLayout) => void;
}) {
  return (
    <div
      role="group"
      aria-label="طريقة العرض"
      className="inline-flex rounded-xl border border-border bg-background p-1"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        aria-label="عرض قائمة"
        className={`rounded-lg p-2 transition ${
          value === "list"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        aria-label="عرض شبكة"
        className={`rounded-lg p-2 transition ${
          value === "grid"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className="size-4" />
      </button>
    </div>
  );
}
