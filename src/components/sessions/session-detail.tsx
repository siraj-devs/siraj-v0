import type { ClubSession, SessionPerson } from "@/app/actions/sessions";
import { PublishBadge } from "@/components/dashboard/status-badge";
import { Rosette } from "@/components/islamic-motif";
import { Button } from "@/components/ui/button";
import { formatSessionDueDate } from "@/lib/session-date";
import { sessionPersonKey } from "@/lib/session-people";
import { cn } from "@/lib/utils";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";
import {
  ArrowRight,
  CalendarDays,
  Clapperboard,
  ExternalLink,
  Mic,
  Users,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PersonAvatar } from "./session-people";

function PeoplePanel({
  icon,
  title,
  people,
  emptyText,
}: {
  icon: ReactNode;
  title: string;
  people: SessionPerson[];
  emptyText: string;
}) {
  return (
    <section className="rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <h2 className="inline-flex items-center gap-2 font-kufam text-lg text-foreground">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-4">
            {icon}
          </span>
          {title}
        </h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {people.length}
        </span>
      </div>

      {people.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2 p-3">
          {people.map((person) => {
            const isMember = person.member_id != null;
            const body = (
              <>
                <PersonAvatar person={person} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {person.name}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "rounded px-1 py-px text-[11px] ring-1 ring-inset",
                        isMember
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                          : "bg-slate-50 text-slate-700 ring-slate-200",
                      )}
                    >
                      {isMember ? "عضو" : "42"}
                    </span>
                    {person.login && (
                      <span dir="ltr" className="truncate">
                        @{person.login}
                      </span>
                    )}
                  </p>
                </div>
              </>
            );
            const className =
              "flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-3 py-2.5";

            return (
              <li key={sessionPersonKey(person)}>
                {isMember ? (
                  <Link
                    href={`/dashboard/members/${person.member_id}`}
                    className={cn(
                      className,
                      "transition hover:border-primary/30 hover:bg-muted/30",
                    )}
                  >
                    {body}
                  </Link>
                ) : person.login ? (
                  <a
                    href={`https://profile.intra.42.fr/users/${encodeURIComponent(person.login)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      className,
                      "transition hover:border-primary/30 hover:bg-muted/30",
                    )}
                  >
                    {body}
                  </a>
                ) : (
                  <div className={className}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function BackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard/sessions"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground",
        className,
      )}
    >
      <ArrowRight className="size-4" />
      الأمسيات
    </Link>
  );
}

export function SessionDetail({ session }: { session: ClubSession }) {
  const embed = session.record_link
    ? youtubeEmbedUrl(session.record_link)
    : null;

  return (
    <div className="flex w-full flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <BackLink className="mb-4 sm:hidden" />
        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl border border-primary/25 sm:w-64 md:w-80 lg:w-88">
            {session.thumbnail ? (
              <Image
                src={session.thumbnail}
                alt={session.title}
                fill
                sizes="(min-width: 1024px) 352px, (min-width: 768px) 320px, (min-width: 640px) 256px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center text-primary/35">
                <Rosette className="size-16" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <BackLink className="hidden pt-1 sm:inline-flex" />
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {session.title}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              {formatSessionDueDate(session.due_date)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <PublishBadge published={session.is_published} />
              {session.series && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800 ring-1 ring-inset ring-violet-200">
                  <Clapperboard className="size-3.5" />
                  {session.series.name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {session.is_published && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link href={`/sessions/${session.id}`}>
                    <ExternalLink className="size-3.5" />
                    صفحة الأعضاء
                  </Link>
                </Button>
              )}
              {session.record_link && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a
                    href={session.record_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <YoutubeLogoIcon
                      weight="fill"
                      className="size-4 text-[#FF0000]"
                    />
                    يوتيوب
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5 lg:*:first:col-span-2 lg:*:last:col-span-3">
        <PeoplePanel
          icon={<Mic />}
          title="المقدّمون"
          people={session.presenters}
          emptyText="لم يُحدَّد مقدّم لهذه الأمسية."
        />
        <PeoplePanel
          icon={<Users />}
          title="المشاركون"
          people={session.participants}
          emptyText="لا مشاركين في هذه الأمسية."
        />
      </div>

      <section className="space-y-4">
        <h2 className="inline-flex items-center gap-2 font-kufam text-xl font-semibold text-foreground">
          <Video className="size-5 text-primary" />
          التسجيل
        </h2>
        {embed ? (
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/80 p-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted/12">
              <iframe
                src={embed}
                title={session.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border px-6 py-10 text-center">
            <Video className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              لا تسجيل مرفق بهذه الأمسية بعد.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
