import React from "react";

function formatKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function CalendarMonthView({
  monthOffset = 0,
  minDate,
  maxDate,
  highlightedDates,
}: {
  monthOffset?: number;
  minDate?: Date;
  maxDate?: Date;
  highlightedDates?: Date[];
}) {
  const today = new Date();
  // normalize total months and compute correct year/month for the requested offset
  const totalMonth = today.getMonth() + monthOffset;
  const year = today.getFullYear() + Math.floor(totalMonth / 12);
  const month = ((totalMonth % 12) + 12) % 12; // 0-11 normalized for negative offsets
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();
  const startWeekDay = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

  const startOfDay = (d: Date) => {
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    return dd;
  };
  const endOfDay = (d: Date) => {
    const dd = new Date(d);
    dd.setHours(23, 59, 59, 999);
    return dd;
  };

  const min = minDate ? startOfDay(minDate) : undefined;
  const max = maxDate ? endOfDay(maxDate) : undefined;

  // highlighted set for O(1) checks
  const highlightedSet = new Set(
    (highlightedDates || []).map((d) => formatKey(startOfDay(d))),
  );

  // compute only the required number of weeks (no always-42 cells)
  const totalCellsNeeded = startWeekDay + daysInMonth;
  const weeks = Math.ceil(totalCellsNeeded / 7);
  const totalCells = weeks * 7;
  const cells = Array.from({ length: totalCells }).map((_, i) => {
    const dayNumber = i - startWeekDay + 1;
    return dayNumber >= 1 && dayNumber <= daysInMonth ? dayNumber : null;
  });

  const monthLabel = new Date(year, month, 1).toLocaleString("ar-u-nu-latn", {
    month: "long",
    year: "numeric",
  });
  const weekDayLabels = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  };

  return (
    <section aria-label="Calendar month view">
      <div className="mb-2 flex items-center justify-between">
        <h2 style={{ margin: 0, fontSize: 18 }}>{monthLabel}</h2>
      </div>

      <div style={{ ...gridStyle, marginBottom: 6 }}>
        {weekDayLabels.map((d) => (
          <div key={d} className="pb-1.5 text-center text-xs text-[#444]">
            {d}
          </div>
        ))}
      </div>

      <div style={gridStyle}>
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={idx}
                className="flex aspect-square items-center justify-center rounded-lg border border-black/5 p-2"
                aria-hidden
              ></div>
            );
          }

          const cellDate = startOfDay(new Date(year, month, day));
          const isBeforeMin = min ? cellDate < min : false;
          const isAfterMax = max ? cellDate > max : false;
          const isDisabled = isBeforeMin || isAfterMax;

          const isToday =
            !isDisabled &&
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          const isHighlighted = highlightedSet.has(formatKey(cellDate));

          return (
            <div
              key={idx}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-disabled={isDisabled}
              title={
                isHighlighted
                  ? `Highlighted: ${cellDate.toLocaleDateString()}`
                  : undefined
              }
              className={`flex aspect-square items-center justify-center rounded-lg p-2 ${
                isDisabled ? "cursor-not-allowed" : "cursor-pointer"
              } ${
                isDisabled
                  ? "bg-transparent"
                  : isToday
                    ? "bg-blue-50"
                    : isHighlighted
                      ? "bg-yellow-50"
                      : "bg-gray-50"
              }`}
              style={{
                color: isDisabled ? "#9aa0a6" : "#111",
                boxSizing: "border-box",
                fontWeight: isToday ? 600 : 400,
                border: isToday
                  ? "2px solid #2563eb"
                  : isHighlighted
                    ? "2px solid #f59e0b"
                    : "1px solid rgba(0,0,0,0.06)",
                opacity: isDisabled ? 0.5 : 1,
                position: "relative",
              }}
            >
              <span>{day}</span>
              {isHighlighted && isToday && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-2 size-2 rounded-full bg-[#d97706] shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function Page() {
  const min = new Date();
  const max = new Date(2026, 1, 18);

  const highlightedDates = (() => {
    // normalize start/end to UTC midnight
    const now = new Date();
    const startUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const maxDate = new Date(max);
    const endUtc = new Date(
      Date.UTC(
        maxDate.getUTCFullYear(),
        maxDate.getUTCMonth(),
        maxDate.getUTCDate(),
      ),
    );

    const wednesdays: Date[] = [];
    const WED = 3; // Sunday=0, Monday=1, ..., Wednesday=3

    const offset = (WED - startUtc.getUTCDay() + 7) % 7;
    const firstWednesday = new Date(
      Date.UTC(
        startUtc.getUTCFullYear(),
        startUtc.getUTCMonth(),
        startUtc.getUTCDate() + offset,
      ),
    );

    if (firstWednesday <= endUtc) {
      for (
        let d = new Date(firstWednesday);
        d <= endUtc;
        d = new Date(
          Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7),
        )
      ) {
        // push a UTC-midnight Date
        wednesdays.push(
          new Date(
            Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
          ),
        );
      }
    }

    return wednesdays;
  })();

  return (
    <div className="bg-red50 flex flex-wrap justify-center gap-12">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-red100">
          <CalendarMonthView
            monthOffset={i}
            minDate={min}
            maxDate={max}
            highlightedDates={highlightedDates}
          />
        </div>
      ))}
    </div>
  );
}
