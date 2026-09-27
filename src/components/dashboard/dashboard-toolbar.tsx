"use client";

import {
  SearchFilterBar,
  type FilterGroup,
} from "@/components/dashboard/search-filter-bar";
import type { ViewLayout } from "@/components/layout-toggle";

export type { FilterGroup };

/** Search, filter panel, and layout toggle shared by dashboard managers. */
export function DashboardToolbar({
  query,
  onQueryChange,
  searchPlaceholder,
  menuTitle,
  groups,
  onReset,
  layout,
  onLayoutChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  menuTitle: string;
  groups: FilterGroup[];
  onReset: () => void;
  layout: ViewLayout;
  onLayoutChange: (value: ViewLayout) => void;
}) {
  return (
    <SearchFilterBar
      query={query}
      onQueryChange={onQueryChange}
      searchPlaceholder={searchPlaceholder}
      menuTitle={menuTitle}
      groups={groups}
      onReset={onReset}
      layout={layout}
      onLayoutChange={onLayoutChange}
    />
  );
}
