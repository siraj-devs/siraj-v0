"use client";

import { RemoteAvatar } from "@/components/remote-avatar";
import type { ClassLeaderboardEntry } from "@/lib/course-types";
import { cn } from "@/lib/utils";
import { ChevronLeft, Crown, Medal, Trophy } from "lucide-react";
import Link from "next/link";

function pointsLabel(value: number) {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 1) return "نقطة واحدة";
  if (rounded === 2) return "نقطتان";
  return `${rounded} نقطة`;
}

function podiumTone(rank: number): 1 | 2 | 3 {
  if (rank <= 1) return 1;
  if (rank === 2) return 2;
  return 3;
}

function RankBadge({
  rank,
  compact = false,
  /** Rank 4+ (and forced plain) show a regular number — no medal/trophy/crown. */
  plain = false,
}: {
  rank: number;
  compact?: boolean;
  plain?: boolean;
}) {
  const size = compact ? "size-8" : "size-10";
  const icon = compact ? "size-4" : "size-5";
  if (!plain && rank === 1) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/25",
          size,
        )}
      >
        <Crown className={icon} />
      </span>
    );
  }
  if (!plain && rank === 2) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl bg-slate-400/15 text-slate-700 ring-1 ring-slate-400/25",
          size,
        )}
      >
        <Trophy className={icon} />
      </span>
    );
  }
  if (!plain && rank === 3) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl bg-orange-500/15 text-orange-900 ring-1 ring-orange-500/25",
          size,
        )}
      >
        <Medal className={icon} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-2xl bg-muted font-kufam text-sm text-muted-foreground",
        size,
      )}
    >
      {rank}
    </span>
  );
}

function AvatarFallback({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-primary/10 font-kufam text-primary",
        className,
      )}
    >
      {name.trim().charAt(0) || "؟"}
    </div>
  );
}

function PodiumPoints({
  value,
  tone,
}: {
  value: number;
  tone: 1 | 2 | 3;
}) {
  const styles = {
    1: "border-amber-500/40 bg-amber-500/15 text-amber-950 shadow-[0_8px_24px_-16px_rgba(245,158,11,0.55)]",
    2: "border-slate-400/40 bg-slate-400/15 text-slate-900 shadow-[0_8px_24px_-16px_rgba(100,116,139,0.45)]",
    3: "border-orange-500/40 bg-orange-500/15 text-orange-950 shadow-[0_8px_24px_-16px_rgba(249,115,22,0.45)]",
  } as const;

  return (
    <div
      className={cn(
        "mt-1 inline-flex min-w-24 flex-col items-center rounded-2xl border px-4 py-2.5",
        styles[tone],
      )}
    >
      <span className="font-kufam text-2xl font-semibold leading-none tracking-tight">
        {Math.round(value * 100) / 100}
      </span>
      <span className="mt-1 text-[11px] font-medium opacity-80">نقطة</span>
    </div>
  );
}

function PodiumCard({
  entry,
  layoutPlace,
  isYou,
}: {
  entry: ClassLeaderboardEntry;
  /** Visual column height only (2nd | 1st | 3rd layout). */
  layoutPlace: 1 | 2 | 3;
  isYou: boolean;
}) {
  const tone = podiumTone(entry.rank);
  const heights = { 1: "mt-2", 2: "mt-6", 3: "mt-10" } as const;
  const tones = {
    1: "border-amber-500/35 bg-linear-to-b from-amber-500/12 to-background",
    2: "border-slate-400/35 bg-linear-to-b from-slate-400/10 to-background",
    3: "border-orange-500/35 bg-linear-to-b from-orange-500/10 to-background",
  } as const;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border px-3 py-5 text-center shadow-sm",
        heights[layoutPlace],
        tones[tone],
        layoutPlace === 1 && "sm:-translate-y-2",
        isYou && "ring-2 ring-primary/30",
      )}
    >
      <RankBadge rank={entry.rank} />
      <RemoteAvatar
        src={entry.member.avatar}
        alt={entry.member.name}
        className={cn(
          "rounded-2xl object-cover ring-2 ring-background",
          layoutPlace === 1 ? "size-16" : "size-14",
        )}
        fallback={
          <AvatarFallback
            name={entry.member.name}
            className={layoutPlace === 1 ? "size-16 text-xl" : "size-14 text-lg"}
          />
        }
      />
      <div className="min-w-0 space-y-2">
        <p className="truncate text-base font-medium text-foreground">
          {entry.member.name}
          {isYou ? (
            <span className="ms-1 text-xs font-normal text-primary">أنت</span>
          ) : null}
        </p>
        <PodiumPoints value={entry.totalPoints} tone={tone} />
      </div>
    </div>
  );
}

export function ClassLeaderboard({
  entries,
  currentMemberId,
  courseId,
  compact = false,
}: {
  entries: ClassLeaderboardEntry[];
  currentMemberId?: number | null;
  courseId?: number;
  /** Compact list for the learn-shell sidebar. */
  compact?: boolean;
}) {
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrder =
    topThree.length >= 3
      ? [topThree[1]!, topThree[0]!, topThree[2]!]
      : topThree;
  const yourEntry =
    currentMemberId != null
      ? entries.find((entry) => entry.member.id === currentMemberId)
      : null;
  const boardHref =
    courseId != null ? `/portal/learning/${courseId}/leaderboard` : null;

  if (compact) {
    const preview = entries.slice(0, 5);
    const youOutsidePreview =
      yourEntry &&
      !preview.some((entry) => entry.enrollmentId === yourEntry.enrollmentId)
        ? yourEntry
        : null;

    const body = (
      <>
        <div className="flex items-center justify-between border-b border-border/60 bg-primary/5 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 font-kufam text-sm text-foreground">
            <Trophy className="size-3.5 text-primary" />
            لوحة الصدارة
          </span>
          {boardHref ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-primary">
              عرض الكل
              <ChevronLeft className="size-3.5" />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {entries.length}
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            لا مشاركين بعد
          </p>
        ) : (
          <ol>
            {[
              ...preview,
              ...(youOutsidePreview ? [youOutsidePreview] : []),
            ].map((entry) => {
              const isYou = entry.member.id === currentMemberId;
              return (
                <li
                  key={`${entry.enrollmentId}-${isYou && youOutsidePreview ? "you" : "row"}`}
                  className={cn(
                    "flex items-center gap-3 border-b border-border/50 px-3 py-2.5 last:border-b-0",
                    isYou && "bg-primary/6",
                  )}
                >
                  <RankBadge rank={entry.rank} compact />
                  <RemoteAvatar
                    src={entry.member.avatar}
                    alt={entry.member.name}
                    className="size-9 shrink-0 rounded-xl object-cover"
                    fallback={
                      <AvatarFallback
                        name={entry.member.name}
                        className="size-9 text-sm"
                      />
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.member.name}
                      {isYou ? (
                        <span className="ms-1 text-[11px] font-normal text-primary">
                          أنت
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="font-kufam text-sm text-foreground">
                    {entry.totalPoints}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </>
    );

    const shellClass =
      "overflow-hidden rounded-2xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]";

    if (boardHref) {
      return (
        <Link
          href={boardHref}
          className={cn(
            shellClass,
            "block transition hover:border-primary/30 hover:bg-background",
          )}
        >
          {body}
        </Link>
      );
    }

    return <section className={shellClass}>{body}</section>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-kufam text-xl font-semibold text-foreground">
            لوحة الصدارة
          </h3>
          <p className="text-sm text-muted-foreground">
            الترتيب حسب التقدّم ونقاط التقويمات. المشرفون غير مشمولين.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Trophy className="size-3.5 text-primary" />
          {entries.length} مشارك
        </span>
      </div>

      {yourEntry && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <RankBadge rank={yourEntry.rank} compact />
            <div>
              <p className="text-sm font-medium text-foreground">ترتيبك</p>
              <p className="text-xs text-muted-foreground">
                {pointsLabel(yourEntry.totalPoints)}
              </p>
            </div>
          </div>
          <span className="font-kufam text-lg text-primary">
            #{yourEntry.rank}
          </span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
          <Trophy className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            لا مشاركين في لوحة الصدارة بعد.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {topThree.length > 0 && (
            <div
              className={cn(
                "grid gap-3",
                topThree.length === 1 && "mx-auto max-w-xs grid-cols-1",
                topThree.length === 2 && "sm:grid-cols-2",
                topThree.length >= 3 && "sm:grid-cols-3",
              )}
            >
              {topThree.length >= 3
                ? podiumOrder.map((entry, index) => (
                    <PodiumCard
                      key={entry.enrollmentId}
                      entry={entry}
                      layoutPlace={
                        (index === 0 ? 2 : index === 1 ? 1 : 3) as 1 | 2 | 3
                      }
                      isYou={entry.member.id === currentMemberId}
                    />
                  ))
                : topThree.map((entry, index) => (
                    <PodiumCard
                      key={entry.enrollmentId}
                      entry={entry}
                      layoutPlace={Math.min(index + 1, 3) as 1 | 2 | 3}
                      isYou={entry.member.id === currentMemberId}
                    />
                  ))}
            </div>
          )}

          {rest.length > 0 && (
            <ol className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
              {rest.map((entry) => {
                const isYou = entry.member.id === currentMemberId;
                return (
                  <li
                    key={entry.enrollmentId}
                    className={cn(
                      "flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3.5 last:border-b-0 sm:gap-4 sm:px-6",
                      isYou && "bg-primary/6",
                    )}
                  >
                    <RankBadge rank={entry.rank} plain />
                    <RemoteAvatar
                      src={entry.member.avatar}
                      alt={entry.member.name}
                      className="size-11 shrink-0 rounded-2xl object-cover"
                      fallback={
                        <AvatarFallback
                          name={entry.member.name}
                          className="size-11 text-sm"
                        />
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-foreground">
                        {entry.member.name}
                        {isYou ? (
                          <span className="ms-1 text-xs font-normal text-primary">
                            أنت
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="font-kufam text-lg text-foreground">
                        {entry.totalPoints}
                      </p>
                      <p className="text-[11px] text-muted-foreground">نقطة</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
