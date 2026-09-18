"use client";

import type { ClubEvent } from "@/app/actions/events";
import {
  KebabMenu,
  type KebabMenuItem,
} from "@/components/dashboard/kebab-menu";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import { Rosette } from "@/components/islamic-motif";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { formatRepeatLabel } from "@/lib/event-repeat";
import { Pencil, Plus, Trash2 } from "lucide-react";

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  return `${start.toLocaleString("ar-MA", opts)} – ${end.toLocaleString("ar-MA", opts)}`;
}

function EventMeta({ event }: { event: ClubEvent }) {
  const repeat = formatRepeatLabel(event.repeat_mode, event.repeat_weekdays);
  return (
    <>
      <p className="text-sm text-muted-foreground">
        {formatRange(event.start_at, event.end_at)}
      </p>
      {repeat && (
        <p className="text-xs text-muted-foreground/90">{repeat}</p>
      )}
    </>
  );
}

export function EventsList({
  events,
  allEventsCount,
  layout,
  canManage,
  openMenuId,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDelete,
  onCreate,
}: {
  events: ClubEvent[];
  allEventsCount: number;
  layout: ViewLayout;
  canManage: boolean;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onEdit: (event: ClubEvent) => void;
  onDelete: (event: ClubEvent) => void;
  onCreate: () => void;
}) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <Rosette className="mb-4 size-10 text-primary/25" />
        <p className="font-kufam text-lg text-foreground">لا نتائج</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {allEventsCount === 0
            ? "أنشئ أول حدث ليظهر هنا وفي التقويم."
            : "جرّب تغيير نص البحث."}
        </p>
        {canManage && allEventsCount === 0 && (
          <Button onClick={onCreate} className="mt-6 gap-2">
            <Plus className="size-4" />
            حدث جديد
          </Button>
        )}
      </div>
    );
  }

  function itemsFor(event: ClubEvent): KebabMenuItem[] {
    if (!canManage) return [];
    return [
      {
        key: "edit",
        label: "تعديل",
        icon: <Pencil className="size-3.5" />,
        onClick: () => onEdit(event),
      },
      {
        key: "delete",
        label: "حذف",
        icon: <Trash2 className="size-3.5" />,
        variant: "destructive",
        onClick: () => onDelete(event),
      },
    ];
  }

  if (layout === "list") {
    return (
      <ul className="space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className={`relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
              openMenuId === event.id ? "z-50" : "z-0"
            }`}
          >
            <div className="flex min-w-0 items-center gap-4">
              <span
                className="size-9 shrink-0 rounded-xl ring-1 ring-black/5"
                style={{ backgroundColor: event.color }}
                aria-hidden
              />
              <div className="min-w-0 space-y-1">
                <h3 className="truncate font-kufam text-lg text-foreground">
                  {event.name}
                </h3>
                <EventMeta event={event} />
              </div>
            </div>

            {canManage && (
              <div className="relative shrink-0 self-end sm:self-center">
                <ListRowActions
                  items={itemsFor(event)}
                  open={openMenuId === event.id}
                  onToggle={() => onToggleMenu(event.id)}
                  onClose={onCloseMenu}
                  menuPlacement="up"
                  ariaLabel="خيارات الحدث"
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <article
          key={event.id}
          style={{ borderInlineStartColor: event.color }}
          className={`group relative flex flex-col gap-2 rounded-3xl border border-s-4 border-border/80 bg-background/70 p-5 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 ${
            openMenuId === event.id ? "z-50" : "z-0"
          }`}
        >
          {canManage && (
            <div className="absolute top-3 left-3 z-20">
              <KebabMenu
                items={itemsFor(event)}
                open={openMenuId === event.id}
                onToggle={() => onToggleMenu(event.id)}
                onClose={onCloseMenu}
                placement="down"
                ariaLabel="خيارات الحدث"
                buttonClassName="rounded-lg bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
              />
            </div>
          )}
          <div className="flex items-center gap-2.5 pe-8">
            <span
              className="size-3.5 shrink-0 rounded-full ring-1 ring-black/5"
              style={{ backgroundColor: event.color }}
              aria-hidden
            />
            <h3 className="min-w-0 truncate font-kufam text-xl font-medium text-foreground">
              {event.name}
            </h3>
          </div>
          <EventMeta event={event} />
        </article>
      ))}
    </div>
  );
}
