"use client";

import type { ClubEvent } from "@/app/actions/events";
import {
  parseGregorianDate,
  toDateKey,
} from "@/lib/hijri-calendar";
import { cn } from "@/lib/utils";

const WEEKDAYS_AR = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

/** Aladhan weekday → index for Saturday-first grid (0 = Saturday). */
const WEEKDAY_INDEX_SAT_FIRST: Record<string, number> = {
  Saturday: 0,
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
};

const FRIDAY_COLUMN = 6;

function getWeekIndex(en: string) {
  return WEEKDAY_INDEX_SAT_FIRST[en] ?? 0;
}

export function eventsForDay(events: ClubEvent[], dayStart: Date): ClubEvent[] {
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return events.filter((e) => {
    const start = new Date(e.start_at);
    const end = new Date(e.end_at);
    return start < dayEnd && end > dayStart;
  });
}

function gregorianSpan(days: HijriDay[]): string {
  const first = parseGregorianDate(days[0]);
  const last = parseGregorianDate(days[days.length - 1]);
  const month = (d: Date) => d.toLocaleDateString("ar-MA", { month: "long" });
  const year = last.getFullYear();
  if (first.getMonth() === last.getMonth() && first.getFullYear() === year) {
    return `${month(first)} ${year}م`;
  }
  if (first.getFullYear() === year) {
    return `${month(first)} – ${month(last)} ${year}م`;
  }
  return `${month(first)} ${first.getFullYear()} – ${month(last)} ${year}م`;
}

export function HijriCalendarMonth({
  days,
  events,
  rangeStartKey,
  rangeEndKey,
  selectedKey,
  onSelectDay,
}: {
  days: HijriDay[];
  events: ClubEvent[];
  /** Days outside [rangeStartKey, rangeEndKey] are hidden (UI-only range). */
  rangeStartKey?: string;
  rangeEndKey?: string;
  selectedKey?: string | null;
  onSelectDay?: (key: string, date: Date) => void;
}) {
  if (!days.length) return null;

  const monthName = days[0].hijri.month.ar;
  const hijriYear = days[0].hijri.year;
  const startWeekday = getWeekIndex(days[0].gregorian.weekday.en);

  const cells: (HijriDay | null)[] = [
    ...Array(startWeekday).fill(null),
    ...days,
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthEventCount = new Set(
    events
      .filter((e) => {
        const first = parseGregorianDate(days[0]);
        const last = parseGregorianDate(days[days.length - 1]);
        const end = new Date(last);
        end.setDate(end.getDate() + 1);
        return new Date(e.start_at) < end && new Date(e.end_at) > first;
      })
      .map((e) => e.id),
  ).size;

  return (
    <section className="flex w-full flex-col rounded-3xl border border-border/70 bg-background/70 p-3 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)] sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2 sm:mb-4">
        <div>
          <h2 className="font-kufam text-base font-semibold text-foreground sm:text-lg">
            {monthName} {hijriYear} هـ
          </h2>
          <p className="text-xs text-muted-foreground">
            {gregorianSpan(days)}
          </p>
        </div>
        {monthEventCount > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
            {monthEventCount} حدث
          </span>
        )}
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAYS_AR.map((d, i) => (
          <div
            key={d}
            className={cn(
              "text-center text-[10px] font-medium sm:text-xs",
              i === FRIDAY_COLUMN ? "text-primary" : "text-muted-foreground",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-14 sm:h-16" />;
          }

          const cellDate = parseGregorianDate(day);
          const key = toDateKey(cellDate);

          if (
            (rangeStartKey && key < rangeStartKey) ||
            (rangeEndKey && key > rangeEndKey)
          ) {
            return (
              <div
                key={idx}
                aria-hidden
                className="h-14 rounded-xl border border-dashed border-border/40 sm:h-16"
              />
            );
          }

          const isToday = cellDate.getTime() === today.getTime();
          const isPast = cellDate < today && !isToday;
          const isSelected = selectedKey === key;
          const isFriday = idx % 7 === FRIDAY_COLUMN;
          const dayEvents = eventsForDay(events, cellDate);
          const [dd] = day.gregorian.date.split("-");

          const title = [
            `${day.hijri.day} ${day.hijri.month.ar} ${day.hijri.year} هـ`,
            `${cellDate.toLocaleDateString("ar-MA", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })} م`,
            dayEvents.map((e) => e.name).join(" · ") || null,
          ]
            .filter(Boolean)
            .join("\n");

          return (
            <button
              key={idx}
              type="button"
              title={title}
              aria-pressed={isSelected}
              onClick={() => onSelectDay?.(key, cellDate)}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-sm transition sm:h-16",
                isFriday && "bg-primary/4",
                !isToday && !isSelected && "border-border/70 hover:bg-muted/50",
                isPast && !isSelected && "opacity-55",
                isToday &&
                  "border-primary/50 bg-primary/10 font-bold text-primary",
                isSelected && "border-primary ring-2 ring-primary/30",
              )}
            >
              <span className="text-sm font-semibold leading-none sm:text-base">
                {day.hijri.day}
              </span>
              <span className="text-[9px] leading-none text-muted-foreground sm:text-[10px]">
                {dd}
              </span>
              {dayEvents.length > 0 && (
                <span className="mt-0.5 flex max-w-full flex-wrap items-center justify-center gap-0.5 px-0.5">
                  {dayEvents.slice(0, 4).map((e) => (
                    <span
                      key={e.id + e.start_at}
                      className="size-1.5 shrink-0 rounded-full sm:size-2"
                      style={{ backgroundColor: e.color }}
                      aria-hidden
                    />
                  ))}
                  {dayEvents.length > 4 && (
                    <span className="text-[8px] leading-none text-muted-foreground">
                      +{dayEvents.length - 4}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
