"use client";

import {
  markContentComplete,
  rateCourse,
  unenrollFromCourse,
} from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  CONTENT_TYPE_HINT,
  CONTENT_TYPE_ICON,
  ProgressRing,
  RatingInput,
} from "@/components/courses/course-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import type {
  CourseContent,
  CourseWithMeta,
  Enrollment,
} from "@/lib/course-types";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListVideo,
  Lock,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function CourseLearnShell({
  course,
  enrollment,
  contents,
  completedIds,
  activeContentId,
  myRating = null,
  children,
}: {
  course: CourseWithMeta;
  enrollment: Enrollment;
  contents: CourseContent[];
  completedIds: number[];
  activeContentId: number | null;
  myRating?: number | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);
  const completed = new Set(completedIds);

  const activeIndex = contents.findIndex((item) => item.id === activeContentId);
  const previous = activeIndex > 0 ? contents[activeIndex - 1] : null;
  const next =
    activeIndex >= 0 && activeIndex < contents.length - 1
      ? contents[activeIndex + 1]
      : null;
  const activeContent = activeIndex >= 0 ? contents[activeIndex] : null;
  const nextUnlocked = Boolean(
    next && activeContent && completed.has(activeContent.id),
  );

  function isLocked(index: number) {
    const earlier = contents[index - 1];
    return index > 0 && !completed.has(earlier.id);
  }

  function onComplete() {
    if (!activeContentId) return;
    startTransition(async () => {
      const result = await markContentComplete(course.id, activeContentId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`التقدم: ${result.progress}%`);
      router.refresh();
    });
  }

  function onRate(rating: number) {
    startTransition(async () => {
      const result = await rateCourse(course.id, rating);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("شكراً لتقييمك");
      router.refresh();
    });
  }

  function onUnenroll() {
    startTransition(async () => {
      const result = await unenrollFromCourse(course.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setConfirmUnenroll(false);
      toast.success("تم إلغاء الالتحاق بالدورة");
      router.push("/courses");
      router.refresh();
    });
  }

  const lessonPanel = (
    <nav className="overflow-hidden rounded-2xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
      <div className="flex items-center justify-between border-b border-border/60 bg-primary/5 px-4 py-3">
        <span className="font-kufam text-sm text-foreground">الدروس</span>
        <span className="text-xs text-muted-foreground">{contents.length}</span>
      </div>
      <ol className="max-h-[60vh] overflow-y-auto">
        {contents.map((item, index) => {
          const Icon = CONTENT_TYPE_ICON[item.type];
          const active = item.id === activeContentId;
          const done = completed.has(item.id);
          const locked = isLocked(index);

          const row = (
            <>
              <span className="w-5 shrink-0 text-center font-kufam text-xs text-muted-foreground">
                {index + 1}
              </span>
              <Icon
                className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {CONTENT_TYPE_HINT[item.type]}
                </span>
              </span>
              {locked ? (
                <Lock className="size-4 shrink-0 text-muted-foreground/70" />
              ) : (
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  }`}
                >
                  {done && <Check className="size-3" />}
                </span>
              )}
            </>
          );

          return (
            <li
              key={item.id}
              className="border-b border-border/50 last:border-b-0"
            >
              {locked ? (
                <div
                  title="أكمل الدرس السابق أولاً"
                  className="flex cursor-not-allowed items-center gap-3 px-3 py-3 text-sm text-foreground/40"
                >
                  {row}
                </div>
              ) : (
                <Link
                  href={`/courses/${course.id}/learn/${item.id}`}
                  className={`flex items-center gap-3 px-3 py-3 text-sm transition-colors ${
                    active
                      ? "bg-primary/8 text-foreground"
                      : "hover:bg-primary/4 text-foreground/80"
                  }`}
                >
                  {row}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  const ratingPanel = (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="mb-2 font-kufam text-sm text-foreground">
        {myRating !== null ? "تقييمك للدورة" : "قيّم الدورة"}
      </p>
      <RatingInput value={myRating} disabled={pending} onRate={onRate} />
      {myRating !== null && (
        <p className="mt-2 text-xs text-muted-foreground">
          شكراً لك، لا يمكن تعديل التقييم بعد إرساله.
        </p>
      )}
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-6 pb-12">
      <header className="rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent p-5 md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted sm:w-48 lg:w-64">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                sizes="(min-width: 1024px) 256px, (min-width: 640px) 192px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ListVideo className="size-8 opacity-50" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <ProgressRing value={enrollment.progress_percentage} size={64} />
              <div className="min-w-0 flex-1">
                <p className="font-kufam text-xs text-primary/80">
                  دورة تعليمية
                </p>
                <h1 className="font-kufam text-xl font-semibold text-foreground md:text-2xl">
                  {course.title}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {completed.size} من {contents.length} مكتمل
                </p>
              </div>
            </div>

            <div className="relative flex shrink-0 justify-end">
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
                  <div className="absolute end-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
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
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-7">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="rounded-3xl border border-border/70 bg-background/70 p-4 shadow-[0_4px_28px_-20px_color-mix(in_oklch,var(--foreground)_15%,transparent)] sm:p-6 md:p-7">
            {children}
          </div>

          {contents.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <NavArrow
                  href={
                    previous
                      ? `/courses/${course.id}/learn/${previous.id}`
                      : null
                  }
                  label="الدرس السابق"
                  icon={ChevronRight}
                />
                <NavArrow
                  href={
                    next && nextUnlocked
                      ? `/courses/${course.id}/learn/${next.id}`
                      : null
                  }
                  label="الدرس التالي"
                  icon={ChevronLeft}
                />
                {activeContent && (
                  <span className="hidden max-w-56 truncate text-sm text-muted-foreground sm:block">
                    {activeContent.title}
                  </span>
                )}
              </div>

              {activeContent && activeContent.type !== "exam" && (
                <Button
                  onClick={onComplete}
                  disabled={pending || completed.has(activeContent.id)}
                  variant={
                    completed.has(activeContent.id) ? "outline" : "default"
                  }
                  className="gap-2"
                >
                  {completed.has(activeContent.id) ? (
                    <>
                      <Check className="size-4" />
                      تم إكمال هذا الدرس
                    </>
                  ) : pending ? (
                    "جاري الحفظ…"
                  ) : (
                    "تعليم كمكتمل"
                  )}
                </Button>
              )}
            </div>
          )}

          {contents.length > 0 && (
            <div className="lg:hidden">{lessonPanel}</div>
          )}
          <div className="lg:hidden">{ratingPanel}</div>
        </div>

        <aside className="hidden w-full shrink-0 space-y-4 lg:block lg:w-80">
          {contents.length > 0 && lessonPanel}
          {ratingPanel}
        </aside>
      </div>

      <ConfirmDeleteModal
        open={confirmUnenroll}
        title="إلغاء الالتحاق بالدورة"
        description={`هل تريد إلغاء التحاقك بدورة «${course.title}»؟ سيتم فقدان تقدمك المحفوظ.`}
        confirmLabel="إلغاء الالتحاق"
        cancelLabel="تراجع"
        pending={pending}
        onCancel={() => setConfirmUnenroll(false)}
        onConfirm={onUnenroll}
      />
    </div>
  );
}

function NavArrow({
  href,
  label,
  icon: Icon,
}: {
  href: string | null;
  label: string;
  icon: React.ElementType;
}) {
  const className = buttonVariants({ variant: "outline", size: "icon" });

  if (!href) {
    return (
      <span
        aria-hidden
        className={`${className} pointer-events-none opacity-40`}
      >
        <Icon className="size-4" />
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      <Icon className="size-4" />
    </Link>
  );
}
