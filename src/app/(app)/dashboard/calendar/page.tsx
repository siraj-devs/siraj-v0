import { listEvents, listEventsForRange } from "@/app/actions/events";
import { listSessionsForRange } from "@/app/actions/sessions";
import { CalendarView } from "@/components/calendar/calendar-view";
import {
  CALENDAR_RANGE_COOKIE,
  defaultResolvedRange,
  parseRangeSpec,
  resolveRangeSpec,
} from "@/lib/calendar-range";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { gregorianBoundsFromDays, toDateKey } from "@/lib/hijri-calendar";
import { cookies } from "next/headers";

export default async function CalendarPage() {
  const { canEdit } = await gateDashboardPage("/dashboard/calendar");

  // Saved per-browser range (cookie); falls back to the default window.
  const store = await cookies();
  const spec = parseRangeSpec(store.get(CALENDAR_RANGE_COOKIE)?.value);
  const custom = spec ? await resolveRangeSpec(spec).catch(() => null) : null;
  const range = custom ?? (await defaultResolvedRange());

  const bounds = gregorianBoundsFromDays(range.months.flatMap((m) => m.days));
  const [events, allEvents, sessions] = await Promise.all([
    bounds ? listEventsForRange(bounds.start, bounds.endExclusive) : [],
    listEvents(),
    bounds
      ? listSessionsForRange(
          toDateKey(bounds.start),
          toDateKey(bounds.endExclusive),
        )
      : [],
  ]);

  return (
    <div className="px-0 py-6 md:py-10">
      <CalendarView
        months={range.months}
        events={events}
        allEvents={allEvents}
        sessions={sessions}
        startKey={range.startKey}
        endKey={range.endKey}
        rangeSpec={custom ? spec : null}
        canManage={canEdit}
      />
    </div>
  );
}
