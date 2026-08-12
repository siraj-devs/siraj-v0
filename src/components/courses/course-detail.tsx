"use client";

import { enrollInCourse } from "@/app/actions/courses";
import {
  CONTENT_TYPE_HINT,
  CONTENT_TYPE_ICON,
  MetaChip,
  ProgressRing,
  StarRating,
} from "@/components/courses/course-ui";
import { Rosette } from "@/components/islamic-motif";
import { Button } from "@/components/ui/button";
import type { CourseWithMeta, Enrollment } from "@/lib/course-types";
import { type CourseContent } from "@/lib/course-types";
import {
  BookOpen,
  HelpCircle,
  Lock,
  LockOpen,
  Play,
  Shield,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function CourseDetail({
  course,
  contents,
  enrollment,
  isLoggedIn,
  isMember,
  hasCompleteProfile,
}: {
  course: CourseWithMeta;
  contents: CourseContent[];
  enrollment: Enrollment | null;
  isLoggedIn: boolean;
  isMember: boolean;
  hasCompleteProfile: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const examCount = contents.filter((item) => item.type === "exam").length;
  const lessonCount = contents.length - examCount;
  const closed = course.enrollment_status !== "open";

  function onEnroll() {
    if (!isLoggedIn) {
      router.push(`/login?next=/courses/${course.id}`);
      return;
    }
    if (!isMember || !hasCompleteProfile) {
      router.push(`/profile?next=/courses/${course.id}`);
      return;
    }

    startTransition(async () => {
      const result = await enrollInCourse(course.id);
      if (!result.success) {
        if (
          result.code === "incomplete_profile" ||
          result.code === "not_member" ||
          result.code === "forbidden"
        ) {
          toast.error(result.error);
          if (result.code === "forbidden") {
            router.push("/courses");
            return;
          }
          router.push(`/profile?next=/courses/${course.id}`);
          return;
        }
        if (result.code === "unauthenticated") {
          router.push(`/login?next=/courses/${course.id}`);
          return;
        }
        toast.error(result.error);
        return;
      }
      toast.success("تم الالتحاق بالدورة");
      router.push(`/courses/${course.id}/learn`);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-10 md:gap-12">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <Rosette className="pointer-events-none absolute -start-10 -bottom-10 size-40 text-primary/5" />

        <div className="relative flex flex-col items-center gap-7 text-center lg:flex-row lg:items-start lg:gap-10 lg:text-start">
          <div className="flex w-full shrink-0 flex-col items-center gap-4 sm:w-80 lg:w-96">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/25 shadow-[0_18px_50px_-30px_color-mix(in_oklch,var(--foreground)_45%,transparent)]">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  sizes="(min-width: 1024px) 384px, (min-width: 640px) 320px, 100vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-primary/35">
                  <Rosette className="size-16" />
                </div>
              )}
            </div>

            {enrollment && (
              <ProgressRing value={enrollment.progress_percentage} size={72} />
            )}

            {enrollment ? (
              <Button asChild className="w-full">
                <Link href={`/courses/${course.id}/learn`}>متابعة التعلم</Link>
              </Button>
            ) : (
              <Button
                onClick={onEnroll}
                disabled={pending || closed}
                className="w-full"
              >
                {!isLoggedIn
                  ? "سجّل الدخول للالتحاق"
                  : !isMember || !hasCompleteProfile
                    ? "أكمل ملفك ثم التحق"
                    : pending
                      ? "جاري الالتحاق…"
                      : "الإلتحاق الآن"}
              </Button>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                  closed
                    ? "bg-rose-50 text-rose-800 ring-rose-200"
                    : "bg-sky-50 text-sky-800 ring-sky-200"
                }`}
              >
                {closed ? (
                  <Lock className="size-3.5" />
                ) : (
                  <LockOpen className="size-3.5" />
                )}
                {closed ? "مغلق" : "مفتوح"}
              </span>
              {course.visibility === "private" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800 ring-1 ring-violet-200 ring-inset">
                  <Shield className="size-3.5" />
                  خاص
                </span>
              )}
            </div>
            <div className="space-y-2">
              <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {course.title}
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-8 text-foreground/65 lg:mx-0">
                {course.description}
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/2.5 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-primary/20 ring-inset">
                <StarRating
                  value={course.rating_avg}
                  count={course.rating_count}
                />
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <MetaChip icon={BookOpen}>الدروس: {lessonCount}</MetaChip>
              <MetaChip icon={HelpCircle}>الاختبارات: {examCount}</MetaChip>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-kufam text-2xl font-semibold text-foreground">
            محتوى الدورة
          </h2>
          <span className="text-sm text-muted-foreground">
            {contents.length} عنصر
          </span>
        </div>

        {contents.length > 0 ? (
          <ol className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
            {contents.map((item, index) => {
              const Icon = CONTENT_TYPE_ICON[item.type];
              const row = (
                <div className="flex items-center gap-4 px-4 py-4 transition-colors sm:px-6">
                  <span className="w-6 shrink-0 text-center font-kufam text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                    {enrollment ? (
                      <Play className="size-4 fill-current" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg text-foreground">
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {CONTENT_TYPE_HINT[item.type]}
                    </span>
                  </span>
                  {!enrollment && (
                    <Lock className="size-4 shrink-0 text-muted-foreground/60" />
                  )}
                </div>
              );

              return (
                <li
                  key={item.id}
                  className="border-b border-border/60 last:border-b-0"
                >
                  {enrollment ? (
                    <Link
                      href={`/courses/${course.id}/learn/${item.id}`}
                      className="block hover:bg-primary/4"
                    >
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">لا دروس بعد.</p>
          </div>
        )}
      </section>
    </div>
  );
}
