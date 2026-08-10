"use client";

import { Input } from "@/components/ui/input";
import { LayoutToggle, type ViewLayout } from "@/components/layout-toggle";
import { Search } from "lucide-react";

export type FilterChip<TKey extends string> = {
  key: TKey;
  label: string;
};

/**
 * Shared search + filter-chip + layout-toggle row used across dashboard
 * manager screens (courses, sessions, meetings, …).
 */
export function DashboardToolbar<TKey extends string>({
  query,
  onQueryChange,
  searchPlaceholder,
  filters,
  activeFilter,
  onFilterChange,
  layout,
  onLayoutChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  filters: FilterChip<TKey>[];
  activeFilter: TKey;
  onFilterChange: (key: TKey) => void;
  layout: ViewLayout;
  onLayoutChange: (value: ViewLayout) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pr-10"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {filters.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFilterChange(chip.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                activeFilter === chip.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground/70 hover:bg-muted/80"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <LayoutToggle value={layout} onChange={onLayoutChange} />
      </div>
    </div>
  );
}
