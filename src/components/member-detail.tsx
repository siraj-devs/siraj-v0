import type { MemberProfile } from "@/app/actions/members";
import type { MemberSessionItem } from "@/app/actions/sessions";
import { PublishBadge } from "@/components/dashboard/status-badge";
import { Rosette } from "@/components/islamic-motif";
import {
  DiscordIcon,
  FortyTwoIcon,
  GoogleIcon,
} from "@/components/member-brand-icons";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { RemoteAvatar } from "@/components/remote-avatar";
import type { MemberLearningItem } from "@/lib/courses";
import type { MemberRole } from "@/lib/member-role";
import { formatSessionDueDate } from "@/lib/session-date";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  Mail,
  Mic,
  Phone,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const ROLE_STYLES: Record<
  MemberRole,
  { badge: string; accent: string; ring: string }
> = {
  owner: {
    badge: "bg-rose-500/10 text-rose-800 ring-rose-500/20",
    accent: "from-rose-500/20 via-rose-500/8 to-transparent",
    ring: "ring-rose-400/40",
  },
  admin: {
    badge: "bg-primary/15 text-[#7a5a08] ring-primary/25",
    accent: "from-primary/25 via-primary/10 to-transparent",
    ring: "ring-primary/45",
  },
  participant: {
    badge: "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20",
    accent: "from-emerald-500/20 via-emerald-500/8 to-transparent",
    ring: "ring-emerald-400/35",
  },
  veteran: {
    badge: "bg-sky-500/10 text-sky-800 ring-sky-500/20",
    accent: "from-sky-500/20 via-sky-500/8 to-transparent",
    ring: "ring-sky-400/40",
  },
  newcomer: {
    badge: "bg-violet-500/10 text-violet-800 ring-violet-500/20",
    accent: "from-violet-500/20 via-violet-500/8 to-transparent",
    ring: "ring-violet-400/35",
  },
};

function BackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard/members"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground",
        className,
      )}
    >
      <ArrowRight className="size-4" />
      الأعضاء
    </Link>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0]!.slice(0, 1);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
}

function ConnectionCard({
  linked,
  value,
  href,
  icon,
  iconWrapClassName,
}: {
  linked: boolean;
  value: string | null;
  href?: string;
  icon: ReactNode;
  iconWrapClassName: string;
}) {
  const content = (
    <>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconWrapClassName}`}
      >
        {icon}
      </span>
      <span
        className={`min-w-0 truncate font-medium ${
          linked ? "text-foreground" : "text-muted-foreground"
        }`}
        dir="ltr"
      >
        {linked && value ? value : "—"}
      </span>
    </>
  );

  const className = `flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
    linked
      ? "border-border/70 bg-background/80 hover:border-primary/30 hover:bg-background"
      : "border-dashed border-border/60 bg-muted/20"
  }`;

  if (linked && href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function MemberDetail({
  member,
  learning = [],
  sessions = [],
}: {
  member: MemberProfile;
  learning?: MemberLearningItem[];
  sessions?: MemberSessionItem[];
}) {
  const presentedCount = sessions.filter((s) =>
    s.roles.includes("presenter"),
  ).length;
  const styles = ROLE_STYLES[member.role];
  const phoneVerified = Boolean(member.phone_verified_at);

  return (
    <div className="flex w-full flex-col gap-8 pb-10">
      <header
        className={`relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-l ${styles.accent} px-6 py-8 md:px-10 md:py-10`}
      >
        <BackLink className="mb-4 sm:hidden" />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-start">
          <RemoteAvatar
            src={member.avatar}
            alt={member.name}
            className={`size-28 shrink-0 rounded-3xl object-cover ring-4 ring-background md:size-32 ${styles.ring}`}
            fallback={
              <div
                className={`flex size-28 items-center justify-center rounded-3xl bg-foreground font-kufam text-3xl text-background ring-4 ring-background md:size-32 ${styles.ring}`}
              >
                {initials(member.name)}
              </div>
            }
          />

          <div className="min-w-0 flex-1 space-y-4">
            <BackLink className="hidden sm:inline-flex" />
            <h1 className="flex flex-wrap items-center justify-center gap-2 font-kufam text-3xl font-semibold tracking-tight text-foreground sm:justify-start md:text-4xl">
              <span>{member.name}</span>
              <MemberRoleBadge role={member.role} />
            </h1>

            <div className="flex flex-col items-center gap-2 sm:items-start">
              {member.phone && (
                <p className="inline-flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                  <Phone className="size-3.5 shrink-0" />
                  <span dir="ltr">{member.phone}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                      phoneVerified
                        ? "bg-emerald-500/10 text-emerald-800 ring-emerald-500/25"
                        : "bg-amber-500/10 text-amber-900 ring-amber-500/25"
                    }`}
                  >
                    {phoneVerified ? "موثّق" : "غير موثّق"}
                  </span>
                </p>
              )}
              {member.email && (
                <p className="inline-flex max-w-full items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate" dir="ltr">
                    {member.email}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="font-kufam text-xl font-semibold text-foreground">
            الحسابات المرتبطة
          </h2>
          <p className="text-sm text-muted-foreground">
            الحسابات التي يسجّل بها العضو الدخول.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ConnectionCard
            linked={Boolean(member.login)}
            value={member.login ? `${member.login}` : null}
            href={
              member.login
                ? `https://profile.intra.42.fr/users/${member.login}`
                : undefined
            }
            icon={<FortyTwoIcon className="size-5" />}
            iconWrapClassName="bg-foreground text-background"
          />
          <ConnectionCard
            linked={Boolean(member.dc_username)}
            value={member.dc_username ? `${member.dc_username}` : null}
            icon={<DiscordIcon className="size-5" />}
            iconWrapClassName="bg-[#5865F2]/15 text-[#5865F2]"
          />
          <ConnectionCard
            linked={Boolean(member.google_email)}
            value={member.google_email}
            href={
              member.google_email ? `mailto:${member.google_email}` : undefined
            }
            icon={<GoogleIcon className="size-5" />}
            iconWrapClassName="bg-muted"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-kufam text-xl font-semibold text-foreground">
              الدورات
            </h2>
            <p className="text-sm text-muted-foreground">
              الدورات التي التحق بها العضو وتقدّمه فيها.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {learning.length} دورة
          </span>
        </div>

        {learning.length > 0 ? (
          <ul className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
            {learning.map(({ enrollment, course }) => {
              const done =
                enrollment.status === "completed" ||
                enrollment.progress_percentage >= 100;
              const percent = Math.round(enrollment.progress_percentage);
              return (
                <li
                  key={enrollment.id}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <Link
                    href={`/dashboard/courses/${course.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-muted/40 sm:gap-4 sm:px-6"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                      <BookOpen className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="truncate font-kufam text-base text-foreground">
                        {course.title}
                      </p>
                      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            done ? "bg-emerald-500" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {percent}%
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        done
                          ? "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30"
                          : "bg-sky-500/15 text-sky-800 ring-sky-500/30"
                      }`}
                    >
                      {done ? (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          مكتمل
                        </>
                      ) : (
                        "قيد التعلم"
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-border px-6 py-10 text-center">
            <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              لم يلتحق بأي دورة بعد.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-kufam text-xl font-semibold text-foreground">
              الأمسيات
            </h2>
            <p className="text-sm text-muted-foreground">
              الأمسيات التي قدّمها العضو أو شارك فيها.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {sessions.length} أمسية
            {presentedCount > 0 && ` · قدّم ${presentedCount}`}
          </span>
        </div>

        {sessions.length > 0 ? (
          <ul className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="border-b border-border/60 last:border-b-0"
              >
                <Link
                  href={
                    session.is_published
                      ? `/sessions/${session.id}`
                      : "/dashboard/sessions"
                  }
                  className="flex flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-muted/40 sm:gap-4 sm:px-6"
                >
                  <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">
                    {session.thumbnail ? (
                      <Image
                        src={session.thumbnail}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-linear-to-b from-primary/5 to-primary/2 text-primary/35">
                        <Rosette className="size-5" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-kufam text-base text-foreground">
                      {session.title}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatSessionDueDate(session.due_date)}</span>
                      {session.series && (
                        <span className="inline-flex items-center gap-1">
                          <Clapperboard className="size-3" />
                          {session.series.name}
                        </span>
                      )}
                    </p>
                  </div>
                  {!session.is_published && (
                    <PublishBadge published={false} size="sm" iconOnly />
                  )}
                  {session.roles.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        role === "presenter"
                          ? "bg-violet-500/10 text-violet-800 ring-violet-500/25"
                          : "bg-sky-500/10 text-sky-800 ring-sky-500/25"
                      }`}
                    >
                      {role === "presenter" ? (
                        <Mic className="size-3.5" />
                      ) : (
                        <Users className="size-3.5" />
                      )}
                      {role === "presenter" ? "مقدّم" : "مشارك"}
                    </span>
                  ))}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-border px-6 py-10 text-center">
            <Clapperboard className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              لم يقدّم أو يشارك في أي أمسية بعد.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
