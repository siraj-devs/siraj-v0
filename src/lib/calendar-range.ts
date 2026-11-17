import {
  dayKeyOf,
  enumerateMonths,
  fetchHijriMonth,
  fetchHijriMonthOfDate,
  fromDateKey,
  MAX_RANGE_MONTHS,
  toDateKey,
  type HijriMonthRef,
} from "@/lib/hijri-calendar";

/** Per-browser preference for the calendar's visible range (not in the DB). */
export const CALENDAR_RANGE_COOKIE = "calendar_range";

export type HijriPart = { y: number; m: number; d: number };

export type CalendarRangeSpec =
  | { mode: "hijri"; start: HijriPart; end: HijriPart }
  | { mode: "gregorian"; start: string; end: string };

export type ResolvedRange = {
  startKey: string;
  endKey: string;
  months: (HijriMonthRef & { days: HijriDay[] })[];
};

function isHijriPart(value: unknown): value is HijriPart {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Number.isInteger(v.y) &&
    Number.isInteger(v.m) &&
    Number.isInteger(v.d) &&
    (v.y as number) >= 1 &&
    (v.m as number) >= 1 &&
    (v.m as number) <= 12 &&
    (v.d as number) >= 1 &&
    (v.d as number) <= 30
  );
}

export function parseRangeSpec(
  raw: string | undefined | null,
): CalendarRangeSpec | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (
      value.mode === "hijri" &&
      isHijriPart(value.start) &&
      isHijriPart(value.end)
    ) {
      return { mode: "hijri", start: value.start, end: value.end };
    }
    if (
      value.mode === "gregorian" &&
      typeof value.start === "string" &&
      typeof value.end === "string" &&
      fromDateKey(value.start) &&
      fromDateKey(value.end)
    ) {
      return { mode: "gregorian", start: value.start, end: value.end };
    }
  } catch {
    // ignore malformed cookie
  }
  return null;
}

async function loadMonths(
  refs: HijriMonthRef[],
): Promise<(HijriMonthRef & { days: HijriDay[] })[] | null> {
  const loaded = await Promise.all(
    refs.map(async (ref) => ({
      ...ref,
      days: await fetchHijriMonth(ref.year, ref.month),
    })),
  );
  return loaded.some((m) => m.days.length === 0) ? null : loaded;
}

/** Turn a saved spec into concrete months; `null` when invalid. */
export async function resolveRangeSpec(
  spec: CalendarRangeSpec,
): Promise<ResolvedRange | null> {
  let startRef: HijriMonthRef;
  let endRef: HijriMonthRef;

  if (spec.mode === "hijri") {
    startRef = { year: spec.start.y, month: spec.start.m };
    endRef = { year: spec.end.y, month: spec.end.m };
  } else {
    const s = fromDateKey(spec.start);
    const e = fromDateKey(spec.end);
    if (!s || !e) return null;
    [startRef, endRef] = await Promise.all([
      fetchHijriMonthOfDate(s),
      fetchHijriMonthOfDate(e),
    ]);
  }

  const refs = enumerateMonths(startRef, endRef);
  if (refs.length === 0 || refs.length > MAX_RANGE_MONTHS) return null;

  const months = await loadMonths(refs);
  if (!months) return null;

  let startKey: string;
  let endKey: string;
  if (spec.mode === "hijri") {
    const first = months[0].days;
    const last = months[months.length - 1].days;
    startKey = dayKeyOf(first[Math.min(spec.start.d, first.length) - 1]);
    endKey = dayKeyOf(last[Math.min(spec.end.d, last.length) - 1]);
  } else {
    startKey = toDateKey(fromDateKey(spec.start)!);
    endKey = toDateKey(fromDateKey(spec.end)!);
  }

  if (startKey > endKey) return null;
  return { startKey, endKey, months };
}

/** Current Hijri month + 5 following (the original behaviour). */
export async function defaultResolvedRange(): Promise<ResolvedRange> {
  const current = await fetchHijriMonthOfDate(new Date());
  const refs = Array.from({ length: 6 }).map((_, i) => {
    let m = current.month + i;
    let y = current.year;
    while (m > 12) {
      m -= 12;
      y++;
    }
    return { year: y, month: m };
  });
  const months = (await loadMonths(refs)) ?? [];
  const all = months.flatMap((m) => m.days);
  const first = all[0];
  const last = all[all.length - 1];
  return {
    startKey: first ? dayKeyOf(first) : "",
    endKey: last ? dayKeyOf(last) : "",
    months,
  };
}
