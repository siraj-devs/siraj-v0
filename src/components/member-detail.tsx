import type { MemberProfile } from "@/app/actions/members";
import { RemoteAvatar } from "@/components/remote-avatar";
import { MEMBER_ROLE_LABELS, type MemberRole } from "@/lib/member-role";
import { Mail, Phone } from "lucide-react";
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

function FortyTwoIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.581 16.851H24v-4.439ZM24 3.574h-4.419v4.42l-4.419 4.418v4.44h4.419v-4.44L24 7.993Zm-4.419 0h-4.419v4.42zm-6.324 8.838H4.419l8.838-8.838H8.838L0 12.412v3.595h8.838v4.419h4.419z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
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

export function MemberDetail({ member }: { member: MemberProfile }) {
  const styles = ROLE_STYLES[member.role];
  const phoneVerified = Boolean(member.phone_verified_at);

  return (
    <div className="flex w-full flex-col gap-8 pb-10">
      <header
        className={`relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-l ${styles.accent} px-6 py-8 md:px-10 md:py-10`}
      >
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
            <h1 className="flex items-center gap-2 font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              <span>{member.name}</span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 backdrop-blur-sm ring-inset ${styles.badge}`}
              >
                {MEMBER_ROLE_LABELS[member.role]}
              </span>
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
        <h2 className="font-kufam text-xl text-foreground">
          الحسابات المرتبطة
        </h2>
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
    </div>
  );
}
