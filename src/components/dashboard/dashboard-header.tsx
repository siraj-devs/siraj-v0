"use client";

import type { ReactNode } from "react";

export type DashboardStat<TKey extends string> = {
  key: TKey;
  label: string;
  value: number;
};

/**
 * Shared hero header used by every `/dashboard/*` manager: eyebrow + title +
 * description + primary action, followed by a row of stat buttons that
 * double as filters.
 */
export function DashboardHeader<TKey extends string>({
  eyebrow,
  title,
  description,
  action,
  stats,
  activeStat,
  onStatClick,
  statsClassName = "grid-cols-1 sm:grid-cols-3",
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  stats: DashboardStat<TKey>[];
  activeStat: TKey;
  onStatClick: (key: TKey) => void;
  statsClassName?: string;
}) {
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
        {stats.map((stat) => (
          <button
            key={stat.key}
            type="button"
            onClick={() => onStatClick(stat.key)}
            className={`rounded-2xl border px-4 py-3 text-start transition-all ${
              activeStat === stat.key
                ? "border-primary/40 bg-background shadow-sm"
                : "border-transparent bg-background/50 hover:border-border"
            }`}
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {stat.value}
            </p>
          </button>
        ))}
      </div>
    </header>
  );
}
