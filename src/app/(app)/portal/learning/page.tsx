import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Rosette } from "@/components/islamic-motif";
import { ProgressRing } from "@/components/courses/course-ui";
import { getMemberLearning } from "@/lib/courses";
import { formatClassDate, hasLearningStarted } from "@/lib/course-schedule";
import {
  getMemberForSession,
  isMemberProfileComplete,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PortalLearningPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/portal/learning");

  const member = await getMemberForSession(session);
  if (!member || !isMemberProfileComplete(member)) {
    redirect("/profile?next=/portal/learning");
  }

  const items = await getMemberLearning(member.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10 pb-16 md:gap-10 md:py-14">
      <DashboardHeader
        eyebrow="بوابة الأعضاء"
        title="تعلّمي"
        description="كل بطاقة التحاق واحد. افتحها لتكمل دروس الفترة التي انضممت إليها."
      />

      {items.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const learningStarted = item.courseClass
              ? hasLearningStarted(item.courseClass.learning_starts_at)
              : false;
            return (
            <li key={item.enrollment.id}>
              <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-background/70 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition hover:-translate-y-0.5 hover:border-primary/30">
                <Link
                  href={`/courses/${item.course.id}`}
                  className="absolute inset-0 z-0 rounded-3xl"
                  aria-label={item.course.title}
                />
                <div className="pointer-events-none relative aspect-video bg-muted/30">
                  {item.course.thumbnail_url ? (
                    <Image
                      src={item.course.thumbnail_url}
                      alt={item.course.title}
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-primary/35">
                      <Rosette className="size-12" />
                    </div>
                  )}
                </div>
                <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-kufam text-lg text-foreground">
                      {item.course.title}
                    </h2>
                    <ProgressRing
                      value={item.enrollment.progress_percentage}
                      size={44}
                    />
                  </div>
                  {item.courseClass ? (
                    <p className="text-sm text-muted-foreground">
                      التسجيل{" "}
                      {formatClassDate(item.courseClass.registration_opens_on)}
                      {" · بداية التعلم "}
                      {formatClassDate(item.courseClass.learning_starts_at)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">غير مرتبطة بفترة</p>
                  )}
                  <div className="pointer-events-auto relative z-10 mt-auto flex gap-2">
                    {learningStarted && (
                      <Link
                        href={`/portal/learning/${item.course.id}`}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-primary text-sm font-medium text-primary-foreground"
                      >
                        <BookOpen className="size-3.5" />
                        متابعة التعلم
                      </Link>
                    )}
                    <Link
                      href={`/courses/${item.course.id}`}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-foreground"
                    >
                      عرض الدورة
                    </Link>
                  </div>
                </div>
              </article>
            </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-kufam text-lg text-foreground">لا التحاق بعد</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            انضم عندما تكون فترة التسجيل مفتوحة.
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            تصفّح
          </Link>
        </div>
      )}
    </div>
  );
}
