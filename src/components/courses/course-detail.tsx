"use client";

import { enrollInCourse, unenrollFromCourse } from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  CONTENT_TYPE_ICON,
  MetaChip,
  StarRating,
} from "@/components/courses/course-ui";
import { Rosette } from "@/components/islamic-motif";
import { Button } from "@/components/ui/button";
import type { CourseWithMeta, Enrollment } from "@/lib/course-types";
import { type CourseContent } from "@/lib/course-types";
import {
  formatClassDate,
  formatLessonDuration,
  hasLearningStarted,
  type CourseClass,
} from "@/lib/course-schedule";
import {
  BookOpen,
  HelpCircle,
  Lock,
  LockOpen,
  MoreHorizontal,
  Play,
  Shield,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function CourseDetail({
  course,
  contents,
  enrollment,
  joinClass,
  previewClass,
  previewKind,
  learningStarted,
  isLoggedIn,
  isMember,
  hasCompleteProfile,
}: {
  course: CourseWithMeta;
  contents: CourseContent[];
  enrollment: Enrollment | null;
  joinClass: CourseClass | null;
  previewClass: CourseClass | null;
  previewKind: "enrolled" | "open" | "upcoming" | "none";
  learningStarted: boolean;
  isLoggedIn: boolean;
  isMember: boolean;
  hasCompleteProfile: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);

  const examCount = contents.filter((item) => item.type === "exam").length;
  const lessonCount = contents.length - examCount;
  const closed = !joinClass;

  function onUnenroll() {
    startTransition(async () => {
      const result = await unenrollFromCourse(course.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setConfirmUnenroll(false);
      toast.success("تم إلغاء الالتحاق بالدورة");
      router.refresh();
    });
  }

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
      if (
        joinClass &&
        hasLearningStarted(joinClass.learning_starts_at)
      ) {
        router.push(`/portal/learning/${course.id}`);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-10 md:gap-12">
      <header className="relative rounded-3xl border border-border/70 px-6 py-8 md:px-10 md:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl bg-linear-to-b from-primary/8 to-transparent">
          <Rosette className="absolute -start-10 -bottom-10 size-40 text-primary/5" />
        </div>

        {enrollment && !learningStarted && (
          <div className="absolute top-4 left-4 z-20">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="خيارات الدورة"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="size-4" />
            </Button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="إغلاق القائمة"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute top-11 left-0 z-20 w-52 overflow-hidden rounded-xl border border-border bg-background py-1 text-start shadow-lg">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmUnenroll(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    إلغاء الالتحاق بالدورة
                  </button>
                </div>
              </>
            )}
          </div>
        )}

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
              {course.description && (
                <p className="mx-auto max-w-2xl text-base leading-8 text-foreground/65 lg:mx-0">
                  {course.description}
                </p>
              )}
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
            {previewClass && previewKind === "open" && (
              <p className="text-sm text-muted-foreground">
                التسجيل من{" "}
                <span className="text-foreground">
                  {formatClassDate(previewClass.registration_opens_on)}
                </span>
                {" حتى بداية التعلم "}
                <span className="text-foreground">
                  {formatClassDate(previewClass.learning_starts_at)}
                </span>
              </p>
            )}
            {previewClass && previewKind === "upcoming" && (
              <p className="text-sm text-muted-foreground">
                لا توجد فترة تسجيل مفتوحة اليوم. التسجيل القادم يبدأ{" "}
                <span className="text-foreground">
                  {formatClassDate(previewClass.registration_opens_on)}
                </span>
                {" ويبدأ التعلم "}
                <span className="text-foreground">
                  {formatClassDate(previewClass.learning_starts_at)}
                </span>
                . الدروس أدناه لهذه الفترة.
              </p>
            )}
            {previewClass && previewKind === "enrolled" && !learningStarted && (
              <p className="text-sm text-muted-foreground">
                أنت ملتحق. يبدأ التعلم{" "}
                <span className="text-foreground">
                  {formatClassDate(previewClass.learning_starts_at)}
                </span>
                . الدروس أدناه لدفعتك، وتُفتح في ذلك التاريخ.
              </p>
            )}
            {previewKind === "none" && (
              <p className="text-sm text-muted-foreground">
                لا توجد فترة تسجيل مفتوحة ولا دفعة قادمة.
              </p>
            )}

            {(learningStarted || !enrollment) && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 lg:justify-start">
              {enrollment && learningStarted && (
                <Button asChild>
                  <Link href={`/portal/learning/${course.id}`}>متابعة التعلم</Link>
                </Button>
              )}
              {!enrollment && (
                <Button onClick={onEnroll} disabled={pending || closed}>
                  {!isLoggedIn
                    ? "سجّل الدخول للالتحاق"
                    : !isMember || !hasCompleteProfile
                      ? "أكمل ملفك ثم التحق"
                      : pending
                        ? "جاري الالتحاق…"
                        : closed
                          ? "لا توجد دفعة للالتحاق"
                          : "الإلتحاق الآن"}
                </Button>
              )}
            </div>
            )}
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
                    {enrollment && learningStarted ? (
                      <Play className="size-4 fill-current" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg text-foreground">
                      {item.title}
                    </span>
                    {item.author && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.author}
                      </span>
                    )}
                    {formatLessonDuration(item) && (
                      <span className="block truncate text-xs text-muted-foreground">
                        المدة: {formatLessonDuration(item)}
                      </span>
                    )}
                  </span>
                  {!(enrollment && learningStarted) && (
                    <Lock className="size-4 shrink-0 text-muted-foreground/60" />
                  )}
                </div>
              );

              return (
                <li
                  key={item.id}
                  className="border-b border-border/60 last:border-b-0"
                >
                  {enrollment && learningStarted ? (
                    <Link
                      href={`/portal/learning/${course.id}/${item.id}`}
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
            <p className="font-kufam text-lg text-foreground">
              {previewKind === "upcoming"
                ? "لا دروس في الفترة القادمة بعد"
                : previewKind === "none"
                  ? "لا توجد دفعة لعرض دروسها"
                  : "لا دروس بعد"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {previewKind === "upcoming" && previewClass
                ? `تبدأ فترة التسجيل ${formatClassDate(previewClass.registration_opens_on)}.`
                : previewKind === "none"
                  ? "عند فتح فترة تسجيل ستظهر دروس تلك الدفعة هنا."
                  : "ستظهر الدروس هنا عند إضافتها لهذه الفترة."}
            </p>
          </div>
        )}
      </section>

      <ConfirmDeleteModal
        open={confirmUnenroll}
        title="إلغاء الالتحاق بالدورة"
        description={`هل تريد إلغاء التحاقك بدورة «${course.title}»؟`}
        confirmLabel="إلغاء الالتحاق"
        cancelLabel="تراجع"
        pending={pending}
        onCancel={() => setConfirmUnenroll(false)}
        onConfirm={onUnenroll}
      />
    </div>
  );
}
