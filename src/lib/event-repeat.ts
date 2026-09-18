import type { EventColor } from "@/lib/event-colors";

export type EventRepeatMode = "none" | "daily" | "weekly";

/** JS Date#getDay(): 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Saturday-first order to match the Hijri calendar grid. */
export const WEEKDAYS_SAT_FIRST: { value: Weekday; label: string }[] = [
  { value: 6, label: "السبت" },
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
];

export const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export type RepeatableEvent = {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
  color: EventColor;
  repeat_mode: EventRepeatMode;
  repeat_weekdays: Weekday[];
  created_at?: string;
  updated_at?: string;
};

export function isEventRepeatMode(value: string): value is EventRepeatMode {
  return value === "none" || value === "daily" || value === "weekly";
}

export function normalizeWeekdays(values: unknown): Weekday[] {
  if (!Array.isArray(values)) return [];
  const out = new Set<Weekday>();
  for (const v of values) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isInteger(n) && n >= 0 && n <= 6) {
      out.add(n as Weekday);
    }
  }
  return [...out].sort((a, b) => a - b);
}

export function resolveRepeatMode(value: unknown): EventRepeatMode {
  return typeof value === "string" && isEventRepeatMode(value) ? value : "none";
}

/** Coerce weekly with all 7 days → daily; weekly with empty → error via validate. */
export function normalizeRepeatInput(
  mode: EventRepeatMode,
  weekdays: Weekday[],
): { repeat_mode: EventRepeatMode; repeat_weekdays: Weekday[] | null } {
  if (mode === "none") {
    return { repeat_mode: "none", repeat_weekdays: null };
  }
  if (mode === "daily") {
    return { repeat_mode: "daily", repeat_weekdays: null };
  }
  const days = normalizeWeekdays(weekdays);
  if (days.length === 7) {
    return { repeat_mode: "daily", repeat_weekdays: null };
  }
  return { repeat_mode: "weekly", repeat_weekdays: days };
}

export function validateRepeatInput(
  mode: EventRepeatMode,
  weekdays: Weekday[],
): string | null {
  if (mode === "weekly" && normalizeWeekdays(weekdays).length === 0) {
    return "اختر يوماً واحداً على الأقل للتكرار";
  }
  return null;
}

export function formatRepeatLabel(
  mode: EventRepeatMode,
  weekdays: Weekday[],
): string | null {
  if (mode === "none") return null;
  if (mode === "daily") return "كل يوم";
  const labels = WEEKDAYS_SAT_FIRST.filter((d) =>
    weekdays.includes(d.value),
  ).map((d) => d.label);
  if (labels.length === 0) return "أيام محددة";
  return labels.join("، ");
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function withLocalTime(day: Date, timeSource: Date): Date {
  const out = new Date(day);
  out.setHours(
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    timeSource.getMilliseconds(),
  );
  return out;
}

function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Expand a stored event template into concrete occurrences overlapping
 * [rangeStart, rangeEnd). For `none`, returns the original interval if it overlaps.
 */
export function expandEventOccurrences(
  event: RepeatableEvent,
  rangeStart: Date,
  rangeEnd: Date,
): RepeatableEvent[] {
  const seriesStart = new Date(event.start_at);
  const seriesEnd = new Date(event.end_at);
  if (
    !Number.isFinite(seriesStart.getTime()) ||
    !Number.isFinite(seriesEnd.getTime())
  ) {
    return [];
  }

  if (event.repeat_mode === "none") {
    return intervalsOverlap(seriesStart, seriesEnd, rangeStart, rangeEnd)
      ? [event]
      : [];
  }

  const startTime = seriesStart;
  const endTime = seriesEnd;
  const seriesDayStart = startOfLocalDay(seriesStart);
  const seriesDayEnd = startOfLocalDay(seriesEnd);
  const walkStart = startOfLocalDay(
    rangeStart > seriesDayStart ? rangeStart : seriesDayStart,
  );
  const walkEnd = startOfLocalDay(
    rangeEnd > seriesDayEnd
      ? seriesDayEnd
      : new Date(rangeEnd.getTime() - 1),
  );

  if (walkEnd < walkStart) return [];

  const weekdaySet =
    event.repeat_mode === "weekly"
      ? new Set(normalizeWeekdays(event.repeat_weekdays))
      : null;

  const out: RepeatableEvent[] = [];
  for (
    let day = new Date(walkStart);
    day <= walkEnd;
    day.setDate(day.getDate() + 1)
  ) {
    if (weekdaySet && !weekdaySet.has(day.getDay() as Weekday)) continue;

    const occStart = withLocalTime(day, startTime);
    const occEnd = withLocalTime(day, endTime);
    // Overnight edge: if end time is before/equal start on the clock, end next day
    if (occEnd <= occStart) {
      occEnd.setDate(occEnd.getDate() + 1);
    }
    if (!intervalsOverlap(occStart, occEnd, rangeStart, rangeEnd)) continue;

    out.push({
      ...event,
      start_at: occStart.toISOString(),
      end_at: occEnd.toISOString(),
    });
  }
  return out;
}
