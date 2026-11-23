"use client";

import type { ClubEvent } from "@/app/actions/events";
import type { ClubSession } from "@/app/actions/sessions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SessionPeopleChips } from "@/components/sessions/session-people";
import {
  KebabMenu,
  type KebabMenuItem,
} from "@/components/dashboard/kebab-menu";
import { useEventEditor } from "@/components/events/use-event-editor";
import { Button } from "@/components/ui/button";
import type { CalendarRangeSpec } from "@/lib/calendar-range";
import { formatRepeatLabel } from "@/lib/event-repeat";
import {
  describeDayKey,
  fromDateKey,
  monthKey,
  toDateKey,
  type HijriMonthRef,
} from "@/lib/hijri-calendar";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  Clapperboard,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarRangeEditor } from "./calendar-range-editor";
import {
  eventsForDay,
  HijriCalendarMonth,
  type CalendarItem,
} from "./hijri-calendar-month";

export type CalendarMonthData = HijriMonthRef & { days: HijriDay[] };

type EventFilter = "all" | "upcoming" | "past";

const SESSION_COLOR = "#7c3aed";

type SessionCalendarItem = CalendarItem & { session: ClubSession };

function sessionItem(session: ClubSession): SessionCalendarItem | null {
  const start = fromDateKey(session.due_date.slice(0, 10));
  if (!start) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    id: `session:${session.id}`,
    name: session.title,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    color: SESSION_COLOR,
    session,
  };
}

function timeRange(e: ClubEvent): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${new Date(e.start_at).toLocaleTimeString("ar-MA", opts)} – ${new Date(e.end_at).toLocaleTimeString("ar-MA", opts)}`;
}

function seriesRange(e: ClubEvent): string {
  const date: Intl.DateTimeFormatOptions = { dateStyle: "medium" };
  const full: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  const start = new Date(e.start_at);
  const end = new Date(e.end_at);
  return e.repeat_mode === "none"
    ? `${start.toLocaleString("ar-MA", full)} – ${end.toLocaleString("ar-MA", full)}`
    : `${start.toLocaleDateString("ar-MA", date)} – ${end.toLocaleDateString("ar-MA", date)}`;
}

export function CalendarView({
  months,
  events,
  allEvents,
  sessions,
  startKey,
  endKey,
  rangeSpec,
  canManage,
}: {
  months: CalendarMonthData[];
  /** Occurrences inside the displayed range. */
  events: ClubEvent[];
  allEvents: ClubEvent[];
  /** Sessions dated inside the displayed range. */
  sessions: ClubSession[];
  startKey: string;
  endKey: string;
  rangeSpec: CalendarRangeSpec | null;
  canManage: boolean;
}) {
  const editor = useEventEditor({ canManage });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventFilter>("all");
  const todayKey = toDateKey(new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(
    todayKey >= startKey && todayKey <= endKey ? todayKey : null,
  );

  const allDays = useMemo(() => months.flatMap((m) => m.days), [months]);
  const definitions = allEvents;
  const byId = useMemo(
    () => new Map(definitions.map((e) => [e.id, e] as const)),
    [definitions],
  );

  const counts = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    for (const e of definitions) {
      if (new Date(e.end_at).getTime() >= now) upcoming += 1;
    }
    return {
      all: definitions.length,
      upcoming,
      past: definitions.length - upcoming,
    };
  }, [definitions]);

  const visibleDefinitions = useMemo(() => {
    const now = Date.now();
    return definitions.filter((e) => {
      const isUpcoming = new Date(e.end_at).getTime() >= now;
      if (filter === "upcoming") return isUpcoming;
      if (filter === "past") return !isUpcoming;
      return true;
    });
  }, [definitions, filter]);

  const sessionItems = useMemo(
    () =>
      sessions
        .map(sessionItem)
        .filter((item): item is SessionCalendarItem => item != null),
    [sessions],
  );
  const gridItems = useMemo<CalendarItem[]>(
    () => [...events, ...sessionItems],
    [events, sessionItems],
  );

  const selectedDate = selectedKey ? fromDateKey(selectedKey) : null;
  const selectedEvents = selectedDate ? eventsForDay(events, selectedDate) : [];
  const selectedSessions = selectedDate
    ? eventsForDay(sessionItems, selectedDate)
    : [];

  function itemsFor(event: ClubEvent): KebabMenuItem[] {
    if (!canManage) return [];
    return [
      {
        key: "edit",
        label: "تعديل",
        icon: <Pencil className="size-3.5" />,
        onClick: () => editor.openEdit(event),
      },
      {
        key: "delete",
        label: "حذف",
        icon: <Trash2 className="size-3.5" />,
        variant: "destructive",
        onClick: () => editor.askDelete(event),
      },
    ];
  }

  const panelClass =
    "rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-16">
      <DashboardHeader
        eyebrow="إدارة المجتمع"
        title="الجدول"
        description="التقويم الهجري والميلادي مع أحداث النادي وأمسياته في صفحة واحدة."
        action={
          canManage && (
            <Button onClick={() => editor.openCreate()} className="gap-2">
              <Plus className="size-4" />
              حدث جديد
            </Button>
          )
        }
      />

      <CalendarRangeEditor
        days={allDays}
        startKey={startKey}
        endKey={endKey}
        spec={rangeSpec}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-7">
        {/* Selected day + events: first on mobile so a tap shows its result */}
        <aside className="order-first flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-24 lg:order-last lg:w-80">
          <section aria-live="polite" className={cn(panelClass, "p-4 sm:p-5")}>
            {selectedDate && selectedKey ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-kufam text-base font-semibold text-foreground">
                      {selectedDate.toLocaleDateString("ar-MA", {
                        weekday: "long",
                      })}
                      {selectedKey === todayKey && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-normal text-primary-foreground">
                          اليوم
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {describeDayKey(selectedKey, allDays)}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label="إضافة حدث في هذا اليوم"
                      title="إضافة حدث في هذا اليوم"
                      onClick={() => editor.openCreate(selectedKey)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>

                {selectedSessions.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {selectedSessions.map(({ session }) => {
                      const body = (
                        <>
                          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <Clapperboard className="size-3.5 shrink-0 text-violet-600" />
                            <span className="truncate">{session.title}</span>
                            {!session.is_published && (
                              <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-normal text-amber-800 ring-1 ring-inset ring-amber-200">
                                مخفي
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            أمسية
                            {session.participants.length > 0 &&
                              ` · ${session.participants.length} مشارك`}
                          </p>
                          <SessionPeopleChips
                            people={session.presenters}
                            max={3}
                            className="mt-2"
                          />
                        </>
                      );
                      return (
                        <li
                          key={session.id}
                          style={{ borderInlineStartColor: SESSION_COLOR }}
                          className="rounded-2xl border border-s-4 border-border/70 bg-background px-3 py-2.5"
                        >
                          {session.is_published ? (
                            <Link
                              href={`/sessions/${session.id}`}
                              className="block transition hover:opacity-80"
                            >
                              {body}
                            </Link>
                          ) : (
                            body
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {selectedEvents.length === 0 ? (
                  selectedSessions.length === 0 && (
                    <p className="mt-4 rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                      لا أحداث في هذا اليوم.
                    </p>
                  )
                ) : (
                  <ul className="mt-4 space-y-2">
                    {selectedEvents.map((e) => {
                      const definition = byId.get(e.id);
                      return (
                        <li
                          key={e.id + e.start_at}
                          style={{ borderInlineStartColor: e.color }}
                          className="flex items-center justify-between gap-2 rounded-2xl border border-s-4 border-border/70 bg-background px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {e.name}
                            </p>
                            <p
                              className="mt-0.5 text-xs text-muted-foreground"
                              dir="ltr"
                            >
                              {timeRange(e)}
                            </p>
                          </div>
                          {canManage && definition && (
                            <button
                              type="button"
                              aria-label={`تعديل ${e.name}`}
                              onClick={() => editor.openEdit(definition)}
                              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="size-4" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                اختر يوماً من الجدول لعرض تفاصيله وأحداثه.
              </p>
            )}
          </section>

          <section className={panelClass}>
              <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-primary/5 px-4 py-3">
                <h2 className="inline-flex items-center gap-1.5 font-kufam text-sm text-foreground">
                  <CalendarClock className="size-3.5 text-primary" />
                  كل الأحداث
                </h2>
                <span className="text-xs text-muted-foreground">
                  {visibleDefinitions.length}
                </span>
              </div>

              <div
                role="group"
                aria-label="تصفية الأحداث"
                className="flex gap-1.5 border-b border-border/60 px-3 py-2.5"
              >
                {(
                  [
                    { key: "all", label: "الكل" },
                    { key: "upcoming", label: "قادمة" },
                    { key: "past", label: "منتهية" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={filter === f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      filter === f.key
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {visibleDefinitions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {definitions.length === 0
                      ? "لا أحداث بعد."
                      : "لا أحداث ضمن هذا التصفية."}
                  </p>
                  {canManage && definitions.length === 0 && (
                    <Button
                      onClick={() => editor.openCreate()}
                      size="sm"
                      className="mt-4 gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      أنشئ أول حدث
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="max-h-96 overflow-y-auto">
                  {visibleDefinitions.map((e) => {
                    const repeat = formatRepeatLabel(
                      e.repeat_mode,
                      e.repeat_weekdays,
                    );
                    return (
                      <li
                        key={e.id}
                        className="flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
                      >
                        <span
                          className="mt-1.5 size-2.5 shrink-0 rounded-full ring-1 ring-black/5"
                          style={{ backgroundColor: e.color }}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {e.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {seriesRange(e)}
                          </p>
                          {repeat && (
                            <p className="text-xs text-muted-foreground/80">
                              {repeat}
                            </p>
                          )}
                        </div>
                        {canManage && (
                          <KebabMenu
                            items={itemsFor(e)}
                            open={openMenuId === e.id}
                            onToggle={() =>
                              setOpenMenuId(openMenuId === e.id ? null : e.id)
                            }
                            onClose={() => setOpenMenuId(null)}
                            ariaLabel={`خيارات ${e.name}`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
          </section>
        </aside>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          {months.map((m) => (
            <HijriCalendarMonth
              key={monthKey(m)}
              days={m.days}
              events={gridItems}
              rangeStartKey={startKey}
              rangeEndKey={endKey}
              selectedKey={selectedKey}
              onSelectDay={(key) =>
                setSelectedKey((prev) => (prev === key ? null : key))
              }
            />
          ))}
        </div>
      </div>

      {editor.dialogs}
    </div>
  );
}
