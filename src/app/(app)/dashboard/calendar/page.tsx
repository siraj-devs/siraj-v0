import { listEventsForRange } from "@/app/actions/events";
import {
  fetchHijriMonth,
  gregorianBoundsFromDays,
  HijriCalendarMonth,
} from "@/components/calendar/hijri-calendar-month";

export default async function CalendarPage() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

  const res = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`, {
    cache: "no-store",
  });
  const json = await res.json();
  const currentHijriData = json.data.hijri;

  const startMonth = currentHijriData.month.number;
  const startYear = parseInt(currentHijriData.year, 10);

  const monthsToRender = Array.from({ length: 6 }).map((_, i) => {
    let m = startMonth + i;
    let y = startYear;
    while (m > 12) {
      m -= 12;
      y++;
    }
    return { month: m, year: y };
  });

  const monthsDays = await Promise.all(
    monthsToRender.map((item) => fetchHijriMonth(item.year, item.month)),
  );

  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  for (const days of monthsDays) {
    const bounds = gregorianBoundsFromDays(days);
    if (!bounds) continue;
    if (!rangeStart || bounds.start < rangeStart) rangeStart = bounds.start;
    if (!rangeEnd || bounds.endExclusive > rangeEnd)
      rangeEnd = bounds.endExclusive;
  }

  const events =
    rangeStart && rangeEnd
      ? await listEventsForRange(rangeStart, rangeEnd)
      : [];

  return (
    <div className="container mx-auto space-y-4 p-3 px-4 sm:space-y-6 sm:p-6">
      <div className="grid grid-cols-1 place-items-center gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {monthsToRender.map((item, i) => (
          <HijriCalendarMonth
            key={`${item.year}-${item.month}`}
            days={monthsDays[i] ?? []}
            events={events}
          />
        ))}
      </div>
    </div>
  );
}
