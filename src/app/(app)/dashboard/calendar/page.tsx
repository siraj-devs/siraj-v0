async function getHijriMonth(
  hijriYear: number,
  hijriMonth: number,
): Promise<HijriDay[]> {
  const res = await fetch(
    `https://api.aladhan.com/v1/hToGCalendar/${hijriMonth}/${hijriYear}`,
    { cache: "force-cache" },
  );
  const json = await res.json();
  return json.data;
}

const WEEKDAYS_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function getWeekIndex(en: string) {
  return WEEKDAY_INDEX[en] ?? 0;
}

async function HijriCalendarMonth({
  hijriYear,
  hijriMonth,
}: {
  hijriYear: number;
  hijriMonth: number;
}) {
  const days = await getHijriMonth(hijriYear, hijriMonth);
  if (!days.length) return null;

  const monthName = days[0].hijri.month.ar;
  const yearLabel = days[0].hijri.year;

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
        {monthName} {yearLabel}
      </h2>

      {/* Weekdays */}
      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS_AR.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-bold sm:text-xs ${
              i === 3 ? "text-amber-600" : "text-gray-600"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-12 sm:h-14" />;
          }

          const isWed = getWeekIndex(day.gregorian.weekday.en) === 3;

          const [dd, mm, yyyy] = day.gregorian.date.split("-").map(Number);

          const cellDate = new Date(yyyy, mm - 1, dd);
          cellDate.setHours(0, 0, 0, 0);

          const isToday = cellDate.getTime() === today.getTime();
          const isPast = cellDate < today && !isToday;

          return (
            <div
              key={idx}
              title={`${day.hijri.day} ${day.hijri.month.ar} ${day.hijri.year} هـ\n${day.gregorian.weekday.en} م`}
              className={`flex h-12 flex-col items-center justify-center rounded-md text-sm transition sm:h-14 ${
                isPast ? "opacity-30" : ""
              } ${
                isToday
                  ? "text- bg-blue-50 font-bold text-blue-800 shadow ring-2 ring-blue-200"
                  : isWed
                    ? "border border-amber-200 bg-amber-50 font-semibold text-amber-800"
                    : "border bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm font-semibold sm:text-base">
                {day.hijri.day}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] ${
                  isToday ? "text-gray-400" : "text-gray-400"
                }`}
              >
                {dd}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function Page() {
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

  return (
    <div className="container px-4 mx-auto space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="grid grid-cols-1 place-items-center gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {monthsToRender.map((item) => (
          <HijriCalendarMonth
            key={`${item.year}-${item.month}`}
            hijriYear={item.year}
            hijriMonth={item.month}
          />
        ))}
      </div>
    </div>
  );
}
