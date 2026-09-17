"use client";

import type { ReactNode } from "react";

export type SegmentedChoiceOption<T extends string> = {
  value: T;
  label: string;
  icon: ReactNode;
  /** Active tone classes (border/bg/text). */
  activeClassName: string;
};

/**
 * Two-or-more option segmented control for dashboard forms (publish,
 * visibility, enrollment, …). Matches the publish status field look.
 */
export function SegmentedChoiceField<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  columns = 2,
}: {
  legend: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedChoiceOption<T>[];
  columns?: 2 | 3;
}) {
  const grid =
    columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none">{legend}</legend>
      <div className={`grid gap-2 ${grid}`}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                selected
                  ? option.activeClassName
                  : "border-border bg-background text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              <span className="shrink-0 [&_svg]:size-4">{option.icon}</span>
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
