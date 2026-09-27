"use client";

import { BADGE_TONE_CLASSES, type BadgeTone } from "@/components/dashboard/status-badge";
import { LayoutToggle, type ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type FilterChoice = {
  key: string;
  label: string;
  tone: BadgeTone;
  icon: ReactNode;
};

export type FilterGroup = {
  title: string;
  options: FilterChoice[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/** Empty selection means every value matches. */
export function matchesSelection<T>(selected: readonly T[], value: T) {
  return selected.length === 0 || selected.includes(value);
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

export function SearchFilterBar({
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
  layout?: ViewLayout;
  onLayoutChange?: (value: ViewLayout) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const visibleGroups = groups.filter((group) => group.options.length > 0);
  const activeCount = visibleGroups.reduce(
    (sum, group) => sum + group.selected.length,
    0,
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pr-10"
        />
      </div>

      <div
        ref={rootRef}
        className="relative flex items-center gap-2 self-end sm:self-auto"
      >
        {visibleGroups.length > 0 && (
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
        )}

        {layout && onLayoutChange && (
          <LayoutToggle value={layout} onChange={onLayoutChange} />
        )}

        {open && visibleGroups.length > 0 && (
          <div
            id={panelId}
            role="dialog"
            aria-label="خيارات التصفية"
            className="absolute top-full end-0 z-40 mt-2 w-[min(100vw-2rem,22rem)] origin-top animate-[fade-up_0.18s_ease-out] rounded-2xl border border-border bg-background p-4 shadow-xl sm:w-96"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-kufam text-base font-medium text-foreground">
                {menuTitle}
              </p>
              <div className="flex items-center gap-1">
                {activeCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-muted-foreground"
                    onClick={onReset}
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

            <div className="max-h-[min(24rem,60vh)] space-y-4 overflow-y-auto">
              {visibleGroups.map((group) => (
                <section key={group.title} className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    {group.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => (
                      <FilterOptionButton
                        key={option.key}
                        selected={group.selected.includes(option.key)}
                        tone={option.tone}
                        icon={option.icon}
                        label={option.label}
                        onClick={() =>
                          group.onChange(toggleInList(group.selected, option.key))
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
