"use client";

import {
  getSubmissionAvailabilityLabel,
  getSubmissionTeamLabel,
  type SubmissionRow,
} from "@/lib/submission-labels";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export function SubmissionsManager({
  submissions,
}: {
  submissions: SubmissionRow[];
}) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) => {
      const haystack = [
        s.name,
        s.email,
        s.tel,
        s.team,
        s.connection_id,
        s.connection_login,
        s.connection_username,
        s.about,
        s.notes,
        ...s.skills,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [submissions, query]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative space-y-3">
          <p className="text-sm text-primary">إدارة الموقع</p>
          <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            التقديمات
          </h1>
          <p className="max-w-lg text-foreground/65">
            طلبات الانضمام الواردة من نموذج التسجيل العام.
          </p>
        </div>

        <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/40 bg-background px-4 py-3 shadow-sm">
            <p className="text-xs text-muted-foreground">إجمالي التقديمات</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {submissions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">تم إرسال البريد</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {submissions.filter((s) => s.email_sent).length}
            </p>
          </div>
        </div>
      </header>

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم، البريد، الاتصال…"
          className="pr-10"
        />
      </div>

      {filtered.length > 0 ? (
        <ul className="space-y-3">
          {filtered.map((submission) => {
            const open = openId === submission.id;
            const handle =
              submission.provider === "42"
                ? submission.connection_login
                  ? `@${submission.connection_login}`
                  : submission.connection_id
                : submission.provider === "discord"
                  ? submission.connection_username
                    ? `@${submission.connection_username}`
                    : submission.connection_id
                  : submission.connection_id;
            const profileHref =
              submission.provider === "42" && submission.connection_login
                ? `https://profile.intra.42.fr/users/${submission.connection_login}`
                : null;

            return (
              <li
                key={submission.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-background/70 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : submission.id)}
                  className="flex w-full items-center gap-4 p-4 text-right transition hover:bg-muted/40 sm:px-5"
                >
                  {submission.connection_avatar ? (
                    <Image
                      src={submission.connection_avatar}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted font-kufam text-lg text-muted-foreground">
                      {submission.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-kufam text-lg text-foreground">
                        {submission.name}
                      </h3>
                      {profileHref ? (
                        <Link
                          href={profileHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition hover:bg-primary/15 hover:text-primary"
                          title="فتح ملف 42"
                        >
                          42
                        </Link>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {submission.provider === "42"
                            ? "42"
                            : submission.provider === "discord"
                              ? "ديسكورد"
                              : "اتصال"}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs ${
                          submission.email_sent
                            ? "bg-emerald-500/10 text-emerald-800"
                            : "bg-amber-500/10 text-amber-800"
                        }`}
                      >
                        {submission.email_sent ? "تم إرسال البريد" : "بريد معلّق"}
                      </span>
                    </div>
                    <p className="truncate text-sm text-foreground/70" dir="ltr">
                      {handle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(submission.submitted_at).toLocaleString("ar-MA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>

                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open && (
                  <div className="space-y-4 border-t border-border px-4 py-5 sm:px-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">البريد: </span>
                        <a
                          href={`mailto:${submission.email}`}
                          className="text-foreground hover:text-primary"
                        >
                          {submission.email}
                        </a>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">الهاتف: </span>
                        <a
                          href={`tel:${submission.tel}`}
                          className="text-foreground hover:text-primary"
                          dir="ltr"
                        >
                          {submission.tel}
                        </a>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">الفريق: </span>
                        {getSubmissionTeamLabel(submission.team)}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">التوفر: </span>
                        {getSubmissionAvailabilityLabel(submission.availability)}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-sm text-muted-foreground">
                        المهارات
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {submission.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">نبذة</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                        {submission.about}
                      </p>
                    </div>

                    {submission.notes && (
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          ملاحظات
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                          {submission.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {submissions.length === 0
              ? "لا توجد تقديمات بعد."
              : "جرّب تغيير نص البحث."}
          </p>
        </div>
      )}
    </div>
  );
}
