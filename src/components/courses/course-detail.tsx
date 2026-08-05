"use client";

import { enrollInCourse } from "@/app/actions/courses";
import { Rosette } from "@/components/islamic-motif";
import { Button } from "@/components/ui/button";
import type { CourseWithMeta, Enrollment } from "@/lib/course-types";
import {
  CONTENT_TYPE_LABELS,
  ENROLLMENT_STATUS_LABELS,
  type CourseContent,
} from "@/lib/course-types";
import { BookOpen, Star } from "lucide-react";
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

  function onEnroll() {
    if (!isLoggedIn) {
      router.push(`/login?next=/courses/${course.id}`);
      return;
    }
    if (!isMember) {
      toast.error("يجب أن تكون عضواً في النادي للالتحاق");
      router.push("/join");
      return;
    }
    if (!hasCompleteProfile) {
      router.push(`/profile?next=/courses/${course.id}`);
      return;
    }

    startTransition(async () => {
      const result = await enrollInCourse(course.id);
      if (!result.success) {
        if (result.code === "incomplete_profile") {
          toast.error(result.error);
          router.push(`/profile?next=/courses/${course.id}`);
          return;
        }
        if (result.code === "not_member") {
          toast.error(result.error);
          router.push("/join");
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 md:gap-14">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <Rosette className="pointer-events-none absolute -left-8 -bottom-8 size-36 text-primary/5" />
        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="relative mx-auto w-36 aspect-video shrink-0 overflow-hidden rounded-lg border border-primary/20 bg-muted shadow-[0_8px_30px_-12px_color-mix(in_oklch,var(--primary)_35%,transparent)] md:size-44">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                className="rounded-lg object-cover"
                sizes="176px"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full text-muted-foreground">
                <BookOpen className="size-12 opacity-40" />
              </div>
            )}
          </div>

          <div className="space-y-4 text-center lg:text-right">
            <p className="text-sm text-primary">دورة تعليمية</p>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {course.title}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-8 text-foreground/65 lg:mx-0">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-primary text-primary" />
                {course.rating_avg.toFixed(1)} ({course.rating_count})
              </span>
              <span>{course.lesson_count} دروس</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                التسجيل {ENROLLMENT_STATUS_LABELS[course.enrollment_status]}
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 pt-2 lg:items-start">
              {enrollment ? (
                <Button asChild className="gap-2">
                  <Link href={`/courses/${course.id}/learn`}>متابعة التعلم</Link>
                </Button>
              ) : (
                <Button
                  onClick={onEnroll}
                  disabled={pending || course.enrollment_status !== "open"}
                >
                  {!isLoggedIn
                    ? "سجّل الدخول للالتحاق"
                    : !isMember
                      ? "انضم للنادي أولاً"
                      : !hasCompleteProfile
                        ? "أكمل ملفك ثم التحق"
                        : pending
                          ? "جاري الالتحاق…"
                          : "الالتحاق الآن"}
                </Button>
              )}

              {isLoggedIn && !isMember && !enrollment && (
                <p className="text-sm text-muted-foreground">
                  الدورات متاحة للأعضاء فقط.{" "}
                  <Link href="/join" className="text-primary underline">
                    قدّم طلب الانضمام
                  </Link>
                </p>
              )}

              {isMember && !hasCompleteProfile && !enrollment && (
                <p className="text-sm text-muted-foreground">
                  يجب{" "}
                  <Link
                    href={`/profile?next=/courses/${course.id}`}
                    className="text-primary underline"
                  >
                    إكمال الملف الشخصي
                  </Link>{" "}
                  وانتظار موافقة المالك.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="font-kufam text-2xl font-semibold text-foreground">
          محتوى الدورة
        </h2>
        {contents.length > 0 ? (
          <ol className="space-y-3">
            {contents.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/70 px-4 py-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-kufam text-lg text-foreground">
                    {index + 1}. {item.title}
                  </p>
                  <p className="text-sm text-foreground/65">
                    {CONTENT_TYPE_LABELS[item.type]}
                  </p>
                </div>
              </li>
            ))}
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
