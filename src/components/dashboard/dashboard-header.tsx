"use client";

import type { ReactNode } from "react";

export type DashboardStat<TKey extends string> = {
  key: TKey;
  label: string;
  value: number;
};

/**
 * Shared hero header used by every `/dashboard/*` manager: eyebrow + title +
 * description + primary action, followed by a row of stats. Stats can optionally
 * double as filters when `onStatClick` is provided.
 */
export function DashboardHeader<TKey extends string>({
  eyebrow,
  title,
  description,
  action,
  stats,
  activeStat,
  activeStats,
  onStatClick,
  statsClassName = "grid-cols-1 sm:grid-cols-3",
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  stats: DashboardStat<TKey>[];
  /** Single active key (ignored when `activeStats` is set). */
  activeStat?: TKey | null;
  /** Multi-select highlight for header stat filters. */
  activeStats?: TKey[];
  /** When omitted, stats are display-only (not clickable filters). */
  onStatClick?: (key: TKey) => void;
  statsClassName?: string;
}) {
  const interactive = typeof onStatClick === "function";

  return (
    <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="text-sm text-primary">{eyebrow}</p>
          <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="max-w-lg text-foreground/65">{description}</p>
        </div>
        {action && (
          <div className="shrink-0 self-start md:self-auto">{action}</div>
        )}
      </div>

      <div className={`relative mt-8 grid gap-3 ${statsClassName}`}>
        {stats.map((stat) => {
          const isActive = interactive
            ? activeStats
              ? activeStats.includes(stat.key)
              : activeStat === stat.key
            : false;
          const className = `rounded-2xl border px-4 py-3 text-start transition-all ${
            isActive
              ? "border-primary/40 bg-background shadow-sm"
              : interactive
                ? "border-transparent bg-background/50 hover:border-border"
                : "border-transparent bg-background/50"
          }`;

          if (interactive) {
            return (
              <button
                key={stat.key}
                type="button"
                onClick={() => onStatClick(stat.key)}
                className={className}
              >
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-kufam text-2xl text-foreground">
                  {stat.value}
                </p>
              </button>
            );
          }

          return (
            <div key={stat.key} className={className}>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-kufam text-2xl text-foreground">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>
    </header>
  );
}
