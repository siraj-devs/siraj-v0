import type { ClubEvent } from "@/app/actions/events";

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

function getWeekIndex(en: string) {
  return WEEKDAY_INDEX_SAT_FIRST[en] ?? 0;
}

function parseGregorianDate(day: HijriDay): Date {
  const [dd, mm, yyyy] = day.gregorian.date.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  d.setHours(0, 0, 0, 0);
  return d;
}

function eventsForDay(events: ClubEvent[], dayStart: Date): ClubEvent[] {
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return events.filter((e) => {
    const start = new Date(e.start_at);
    const end = new Date(e.end_at);
    return start < dayEnd && end > dayStart;
  });
}

export function HijriCalendarMonth({
  days,
  events,
}: {
  days: HijriDay[];
  events: ClubEvent[];
}) {
  if (!days.length) return null;

  const monthName = days[0].hijri.month.ar;
  const startWeekday = getWeekIndex(days[0].gregorian.weekday.en);

  const cells: (HijriDay | null)[] = [
    ...Array(startWeekday).fill(null),
    ...days,
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <section className="flex w-full flex-col sm:p-6">
      <h2 className="mb-3 text-center text-base font-bold sm:mb-4 sm:text-lg">
        {monthName}
      </h2>

      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS_AR.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold text-gray-600 sm:text-xs"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-14 sm:h-16" />;
          }

          const cellDate = parseGregorianDate(day);
          const isToday = cellDate.getTime() === today.getTime();
          const isPast = cellDate < today && !isToday;
          const dayEvents = eventsForDay(events, cellDate);

          const gregorianDate = cellDate.toLocaleDateString("ar-MA", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          const eventNames = dayEvents.map((e) => e.name).join(" · ");
          const title = [
            `${day.hijri.day} ${day.hijri.month.ar} ${day.hijri.year} هـ`,
            `${gregorianDate} م`,
            eventNames || null,
          ]
            .filter(Boolean)
            .join("\n");

          const [dd] = day.gregorian.date.split("-");

          return (
            <div
              key={idx}
              title={title}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-md text-sm transition sm:h-16 ${
                isPast ? "opacity-30" : ""
              } ${
                isToday
                  ? "bg-blue-50 font-bold text-blue-800 shadow ring-2 ring-blue-200"
                  : "border bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm font-semibold leading-none sm:text-base">
                {day.hijri.day}
              </span>
              <span className="text-[9px] leading-none text-gray-400 sm:text-[10px]">
                {dd}
              </span>
              {dayEvents.length > 0 && (
                <span className="mt-0.5 flex max-w-full flex-wrap items-center justify-center gap-0.5 px-0.5">
                  {dayEvents.slice(0, 4).map((e) => (
                    <span
                      key={e.id}
                      className="size-1.5 shrink-0 rounded-full sm:size-2"
                      style={{ backgroundColor: e.color }}
                      aria-hidden
                    />
                  ))}
                  {dayEvents.length > 4 && (
                    <span className="text-[8px] leading-none text-gray-500">
                      +{dayEvents.length - 4}
                    </span>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
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
