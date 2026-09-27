"use client";

import type { NetworkKind, NetworkRank } from "@/app/actions/network";
import type { BadgeTone } from "@/components/dashboard/status-badge";
import {
  SearchFilterBar,
  type FilterChoice,
} from "@/components/dashboard/search-filter-bar";
import type { ViewLayout } from "@/components/layout-toggle";
import { RANK_AR } from "@/lib/network-labels";
import {
  Calendar,
  Crown,
  GraduationCap,
  MapPin,
  Medal,
  Star,
  Trophy,
  Waves,
  type LucideIcon,
} from "lucide-react";

export type NetworkFiltersState = {
  ranks: NetworkRank[];
  campuses: string[];
  years: number[];
  kinds: NetworkKind[];
};

export const DEFAULT_NETWORK_FILTERS: NetworkFiltersState = {
  ranks: [],
  campuses: [],
  years: [],
  kinds: [],
};

const RANK_TONE: Record<NetworkRank, BadgeTone> = {
  A: "emerald",
  B: "sky",
  C: "amber",
  D: "slate",
};

const RANK_ICON: Record<NetworkRank, LucideIcon> = {
  A: Crown,
  B: Trophy,
  C: Medal,
  D: Star,
};

const KIND_META: Record<
  NetworkKind,
  { label: string; tone: BadgeTone; icon: LucideIcon }
> = {
  student: { label: "طالب", tone: "rose", icon: GraduationCap },
  pooler: { label: "سباح", tone: "amber", icon: Waves },
};

function choice(
  key: string,
  label: string,
  tone: BadgeTone,
  Icon: LucideIcon,
): FilterChoice {
  return { key, label, tone, icon: <Icon /> };
}

export function NetworkFiltersBar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  campusOptions,
  yearOptions,
  layout,
  onLayoutChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filters: NetworkFiltersState;
  onFiltersChange: (next: NetworkFiltersState) => void;
  campusOptions: { value: string; label: string }[];
  yearOptions: number[];
  layout: ViewLayout;
  onLayoutChange: (value: ViewLayout) => void;
}) {
  return (
    <SearchFilterBar
      query={query}
      onQueryChange={onQueryChange}
      searchPlaceholder="ابحث بالاسم أو الحساب…"
      menuTitle="تصفية الشبكة"
      onReset={() => onFiltersChange(DEFAULT_NETWORK_FILTERS)}
      layout={layout}
      onLayoutChange={onLayoutChange}
      groups={[
        {
          title: "الرتبة",
          selected: filters.ranks,
          onChange: (ranks) =>
            onFiltersChange({ ...filters, ranks: ranks as NetworkRank[] }),
          options: (["A", "B", "C", "D"] as NetworkRank[]).map((rank) =>
            choice(rank, `رتبة ${RANK_AR[rank]}`, RANK_TONE[rank], RANK_ICON[rank]),
          ),
        },
        {
          title: "الحرم",
          selected: filters.campuses,
          onChange: (campuses) => onFiltersChange({ ...filters, campuses }),
          options: campusOptions.map((opt) =>
            choice(opt.value, opt.label, "sky", MapPin),
          ),
        },
        {
          title: "السنة",
          selected: filters.years.map(String),
          onChange: (years) =>
            onFiltersChange({
              ...filters,
              years: years.map((year) => Number(year)),
            }),
          options: yearOptions.map((year) =>
            choice(String(year), String(year), "violet", Calendar),
          ),
        },
        {
          title: "الحالة",
          selected: filters.kinds,
          onChange: (kinds) =>
            onFiltersChange({ ...filters, kinds: kinds as NetworkKind[] }),
          options: (["student", "pooler"] as NetworkKind[]).map((kind) =>
            choice(kind, KIND_META[kind].label, KIND_META[kind].tone, KIND_META[kind].icon),
          ),
        },
      ]}
    />
  );
}
