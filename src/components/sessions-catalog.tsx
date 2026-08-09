"use client";

import type { ClubSession } from "@/app/actions/sessions";
import { Rosette } from "@/components/islamic-motif";
import { formatSessionDueDate } from "@/lib/session-date";
import { Clapperboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const INITIAL_GRID = 9;

function SessionThumb({
  session,
  priority,
  sizes,
}: {
  session: ClubSession;
  priority?: boolean;
  sizes: string;
}) {
  if (session.thumbnail) {
    return (
      <Image
        src={session.thumbnail}
        alt={session.title}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="flex size-full items-center justify-center bg-linear-to-b from-primary/5 to-primary/2 text-primary/35">
      <Rosette className="size-16 md:size-20" />
    </div>
  );
}

function SessionCard({
  session,
  featured = false,
  priority = false,
}: {
  session: ClubSession;
  featured?: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-transparent bg-transparent p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-background/80 hover:shadow-[0_22px_60px_-30px_color-mix(in_oklch,var(--primary)_35%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        featured ? "w-full" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-muted/12 ${
          featured ? "aspect-21/9" : "aspect-video"
        }`}
      >
        <SessionThumb
          session={session}
          priority={priority}
          sizes={
            featured
              ? "100vw"
              : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {session.series && (
          <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground ring-1 ring-border/80 backdrop-blur ring-inset">
            <Clapperboard className="size-3" />
            {session.series.name}
          </span>
        )}
      </div>

      <div className="flex w-full flex-1 flex-col items-center gap-2 px-2 pt-4 pb-1 text-center">
        <p className="w-full text-center text-sm text-muted-foreground">
          {formatSessionDueDate(session.due_date)}
        </p>

        <h3
          className={`w-full text-center font-kufam leading-8 font-medium text-foreground ${
            featured ? "max-w-3xl text-2xl md:text-3xl" : "text-xl"
          }`}
        >
          {session.title}
        </h3>
      </div>
    </Link>
  );
}

export function SessionsCatalog({ sessions }: { sessions: ClubSession[] }) {
  const [visible, setVisible] = useState(INITIAL_GRID);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <Rosette className="mb-4 size-10 text-primary/25" />
        <p className="font-kufam text-lg text-foreground">
          لا أمسيات منشورة بعد
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          ستظهر الأمسيات هنا عند نشرها من لوحة التحكم.
        </p>
      </div>
    );
  }

  const [featured, ...afterFeatured] = sessions;
  const pairRows = afterFeatured.slice(0, 4);
  const remaining = afterFeatured.slice(4);
  const shownRemaining = remaining.slice(0, visible);
  const hasMore = remaining.length > visible;

  return (
    <div className="flex flex-col gap-6 pb-8 md:gap-7">
      <SessionCard session={featured} featured priority />

      {pairRows.length > 0 && (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-7">
          {pairRows.map((session) => (
            <li key={session.id}>
              <SessionCard session={session} />
            </li>
          ))}
        </ul>
      )}

      {shownRemaining.length > 0 && (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {shownRemaining.map((session) => (
            <li key={session.id}>
              <SessionCard session={session} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisible((n) => n + INITIAL_GRID)}
            className="rounded-xl border border-border bg-background px-8 py-3 font-kufam text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/8"
          >
            تحميل المزيد
          </button>
        </div>
      )}
    </div>
  );
}
