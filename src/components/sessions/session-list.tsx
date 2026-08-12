"use client";

import type { ClubSession } from "@/app/actions/sessions";
import { Rosette } from "@/components/islamic-motif";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import {
  KebabMenu,
  type KebabMenuItem,
} from "@/components/dashboard/kebab-menu";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import { PublishBadge } from "@/components/dashboard/status-badge";
import { formatSessionDueDate } from "@/lib/session-date";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function SessionThumb({
  session,
  className,
}: {
  session: ClubSession;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-muted/12 ${className ?? "aspect-video"}`}
    >
      {session.thumbnail ? (
        <Image
          src={session.thumbnail}
          alt={session.title}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-linear-to-b from-primary/5 to-primary/2 text-primary/35">
          <Rosette className="size-14" />
        </div>
      )}
    </div>
  );
}

export function SessionList({
  sessions,
  allSessionsCount,
  layout,
  canManage,
  openMenuId,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onTogglePublish,
  onDelete,
  onCreate,
}: {
  sessions: ClubSession[];
  allSessionsCount: number;
  layout: ViewLayout;
  canManage: boolean;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onEdit: (session: ClubSession) => void;
  onTogglePublish: (session: ClubSession) => void;
  onDelete: (session: ClubSession) => void;
  onCreate: () => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <Rosette className="mb-4 size-10 text-primary/25" />
        <p className="font-kufam text-lg text-foreground">لا نتائج</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {allSessionsCount === 0
            ? "ابدأ بإنشاء أول أمسية لتظهر هنا وعند النشر للأعضاء."
            : "جرّب تغيير نص البحث أو التصفية."}
        </p>
        {canManage && allSessionsCount === 0 && (
          <Button onClick={onCreate} className="mt-6 gap-2">
            <Plus className="size-4" />
            إنشاء أمسية
          </Button>
        )}
      </div>
    );
  }

  function itemsFor(session: ClubSession): KebabMenuItem[] {
    if (!canManage) return [];
    return [
      {
        key: "edit",
        label: "تعديل",
        icon: <Pencil className="size-3.5" />,
        onClick: () => onEdit(session),
      },
      {
        key: "toggle-publish",
        label: session.is_published ? "إخفاء" : "نشر",
        icon: session.is_published ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        ),
        onClick: () => onTogglePublish(session),
      },
      {
        key: "delete",
        label: "حذف",
        icon: <Trash2 className="size-3.5" />,
        variant: "destructive",
        onClick: () => onDelete(session),
      },
    ];
  }

  if (layout === "list") {
    return (
      <ul className="space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className={`relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
              openMenuId === session.id ? "z-50" : "z-0"
            } ${!session.is_published ? "opacity-75" : ""}`}
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">
                {session.thumbnail ? (
                  <Image
                    src={session.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-linear-to-b from-primary/5 to-primary/2 text-primary/35">
                    <Rosette className="size-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-kufam text-lg text-foreground">
                    {session.title}
                  </h3>
                  <PublishBadge published={session.is_published} size="sm" />
                  {session.series && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {session.series.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatSessionDueDate(session.due_date)}
                </p>
                <Link
                  href={session.record_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {session.record_link}
                </Link>
              </div>
            </div>

            {canManage && (
              <div className="relative shrink-0 self-end sm:self-center">
                <ListRowActions
                  items={itemsFor(session)}
                  open={openMenuId === session.id}
                  onToggle={() => onToggleMenu(session.id)}
                  onClose={onCloseMenu}
                  menuPlacement="up"
                  ariaLabel="خيارات الأمسية"
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sessions.map((session) => (
        <article
          key={session.id}
          className={`group relative flex flex-col rounded-3xl border border-border/80 bg-background/70 p-3 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] ${
            openMenuId === session.id ? "z-50" : "z-0"
          } ${!session.is_published ? "opacity-75" : ""}`}
        >
          <div className="relative">
            <SessionThumb session={session} />
            {canManage && (
              <div className="absolute top-2 left-2 z-20">
                <KebabMenu
                  items={itemsFor(session)}
                  open={openMenuId === session.id}
                  onToggle={() => onToggleMenu(session.id)}
                  onClose={onCloseMenu}
                  placement="down"
                  ariaLabel="خيارات الأمسية"
                  buttonClassName="rounded-lg bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
                />
              </div>
            )}
          </div>

          <div className="relative flex flex-1 flex-col items-center px-2 pb-2 pt-4">
            <h3 className="mb-2 text-center font-kufam text-xl font-medium text-foreground">
              {session.title}
            </h3>
            <div className="mb-2 flex flex-wrap justify-center gap-1.5">
              <PublishBadge published={session.is_published} />
              {session.series && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground ring-1 ring-inset ring-border/70">
                  {session.series.name}
                </span>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {formatSessionDueDate(session.due_date)}
            </p>
            <Link
              href={session.record_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto line-clamp-1 pt-3 text-center text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              يوتيوب
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
