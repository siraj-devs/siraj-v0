export const HIJRI_MONTHS_AR = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
] as const;

export const MAX_RANGE_MONTHS = 24;

export type HijriMonthRef = { year: number; month: number };

export function monthKey(ref: HijriMonthRef): string {
  return `${ref.year}-${ref.month}`;
}

/** Aladhan gregorian.date is `DD-MM-YYYY`. */
export function parseGregorianDate(day: HijriDay): Date {
  const [dd, mm, yyyy] = day.gregorian.date.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** `YYYY-MM-DD` in local time (matches `<input type="date">`). */
export function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: string): Date | null {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function dayKeyOf(day: HijriDay): string {
  return toDateKey(parseGregorianDate(day));
}

export async function fetchHijriMonth(
  hijriYear: number,
  hijriMonth: number,
): Promise<HijriDay[]> {
  const res = await fetch(
    `https://api.aladhan.com/v1/hToGCalendar/${hijriMonth}/${hijriYear}`,
    { cache: "force-cache" },
  );
  const json = await res.json();
  return (json.data ?? []) as HijriDay[];
}

/** Hijri month that contains a Gregorian date. */
export async function fetchHijriMonthOfDate(date: Date): Promise<HijriMonthRef> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  const res = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`, {
    cache: "force-cache",
  });
  const json = await res.json();
  const hijri = json?.data?.hijri;
  if (!hijri) throw new Error("تعذر تحويل التاريخ");
  return {
    year: parseInt(hijri.year, 10),
    month: Number(hijri.month.number),
  };
}

/** Inclusive Gregorian day bounds from a list of Hijri calendar days. */
export function gregorianBoundsFromDays(days: HijriDay[]): {
  start: Date;
  endExclusive: Date;
} | null {
  if (days.length === 0) return null;
  let min = parseGregorianDate(days[0]);
  let max = min;
  for (const day of days) {
    const d = parseGregorianDate(day);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  const endExclusive = new Date(max);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return { start: min, endExclusive };
}

/** Consecutive Hijri months from `from` to `to` inclusive. */
export function enumerateMonths(
  from: HijriMonthRef,
  to: HijriMonthRef,
): HijriMonthRef[] {
  const out: HijriMonthRef[] = [];
  let y = from.year;
  let m = from.month;
  while (y < to.year || (y === to.year && m <= to.month)) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (out.length > MAX_RANGE_MONTHS) break;
  }
  return out;
}

/** "٢٣ رجب ١٤٤٧ هـ · ١٢ يناير ٢٠٢٦م" for a Gregorian day key. */
export function describeDayKey(key: string, days: HijriDay[]): string {
  const day = days.find((d) => dayKeyOf(d) === key);
  const date = fromDateKey(key);
  const gregorian = date
    ? date.toLocaleDateString("ar-MA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : key;
  return day
    ? `${day.hijri.day} ${day.hijri.month.ar} ${day.hijri.year} هـ · ${gregorian}م`
    : `${gregorian}م`;
}
