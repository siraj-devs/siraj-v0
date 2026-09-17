"use client";

import type { NetworkKind, NetworkRank } from "@/app/actions/network";
import {
  BADGE_TONE_CLASSES,
  type BadgeTone,
} from "@/components/dashboard/status-badge";
import { LayoutToggle, type ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RANK_AR } from "@/lib/network-labels";
import {
  Calendar,
  Crown,
  Filter,
  GraduationCap,
  MapPin,
  Medal,
  RotateCcw,
  Search,
  Star,
  Trophy,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

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

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function FilterOptionButton({
  selected,
  tone,
  icon,
  label,
  onClick,
}: {
  selected: boolean;
  tone: BadgeTone;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
        selected
          ? BADGE_TONE_CLASSES[tone]
          : "bg-background text-muted-foreground ring-border hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <span className="shrink-0 [&_svg]:size-3.5">{icon}</span>
      {label}
    </button>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const activeCount = useMemo(
    () =>
      filters.ranks.length +
      filters.campuses.length +
      filters.years.length +
      filters.kinds.length,
    [filters],
  );

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function patch(partial: Partial<NetworkFiltersState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="ابحث بالاسم أو الحساب…"
          className="pr-10"
        />
      </div>

      <div ref={rootRef} className="relative flex items-center gap-2 self-end sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="تصفية"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
          className={`relative ${activeCount > 0 ? "border-primary/40 text-primary" : ""}`}
        >
          <Filter className="size-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>

        <LayoutToggle value={layout} onChange={onLayoutChange} />

        {open && (
          <div
            id={panelId}
            role="dialog"
            aria-label="خيارات التصفية"
            className="absolute top-full end-0 z-40 mt-2 w-[min(100vw-2rem,22rem)] origin-top animate-[fade-up_0.18s_ease-out] rounded-2xl border border-border bg-background p-4 shadow-xl sm:w-96"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-kufam text-base font-medium text-foreground">
                تصفية الشبكة
              </p>
              <div className="flex items-center gap-1">
                {activeCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-muted-foreground"
                    onClick={() => onFiltersChange(DEFAULT_NETWORK_FILTERS)}
                  >
                    <RotateCcw className="size-3.5" />
                    مسح
                  </Button>
                )}
                <button
                  type="button"
                  aria-label="إغلاق"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <FilterSection title="الرتبة">
                {(["A", "B", "C", "D"] as NetworkRank[]).map((rank) => {
                  const Icon = RANK_ICON[rank];
                  return (
                    <FilterOptionButton
                      key={rank}
                      selected={filters.ranks.includes(rank)}
                      tone={RANK_TONE[rank]}
                      icon={<Icon />}
                      label={`رتبة ${RANK_AR[rank]}`}
                      onClick={() =>
                        patch({ ranks: toggleInList(filters.ranks, rank) })
                      }
                    />
                  );
                })}
              </FilterSection>

              {campusOptions.length > 0 && (
                <FilterSection title="الحرم">
                  {campusOptions.map((opt) => (
                    <FilterOptionButton
                      key={opt.value}
                      selected={filters.campuses.includes(opt.value)}
                      tone="sky"
                      icon={<MapPin />}
                      label={opt.label}
                      onClick={() =>
                        patch({
                          campuses: toggleInList(filters.campuses, opt.value),
                        })
                      }
                    />
                  ))}
                </FilterSection>
              )}

              {yearOptions.length > 0 && (
                <FilterSection title="السنة">
                  {yearOptions.map((year) => (
                    <FilterOptionButton
                      key={year}
                      selected={filters.years.includes(year)}
                      tone="violet"
                      icon={<Calendar />}
                      label={String(year)}
                      onClick={() =>
                        patch({ years: toggleInList(filters.years, year) })
                      }
                    />
                  ))}
                </FilterSection>
              )}

              <FilterSection title="الحالة">
                {(["student", "pooler"] as NetworkKind[]).map((kind) => {
                  const meta = KIND_META[kind];
                  const Icon = meta.icon;
                  return (
                    <FilterOptionButton
                      key={kind}
                      selected={filters.kinds.includes(kind)}
                      tone={meta.tone}
                      icon={<Icon />}
                      label={meta.label}
                      onClick={() =>
                        patch({ kinds: toggleInList(filters.kinds, kind) })
                      }
                    />
                  );
                })}
              </FilterSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
