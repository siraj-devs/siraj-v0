"use client";

import { markContentComplete, rateCourse } from "@/app/actions/courses";
import { Button } from "@/components/ui/button";
import type {
  CourseContent,
  CourseWithMeta,
  Enrollment,
} from "@/lib/course-types";
import { CONTENT_TYPE_LABELS } from "@/lib/course-types";
import {
  BookOpen,
  CheckCircle2,
  Headphones,
  HelpCircle,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

const TYPE_ICON = {
  watching: Video,
  listening: Headphones,
  reading: BookOpen,
  exam: HelpCircle,
} as const;

export function CourseLearnShell({
  course,
  enrollment,
  contents,
  completedIds,
  activeContentId,
  children,
}: {
  course: CourseWithMeta;
  enrollment: Enrollment;
  contents: CourseContent[];
  completedIds: number[];
  activeContentId: number | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const completed = new Set(completedIds);

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-16 lg:flex-row lg:gap-8">
      <aside className="w-full shrink-0 space-y-4 lg:w-72">
        <div className="rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
          <p className="text-xs text-primary">دورة تعليمية</p>
          <h1 className="mt-1 font-kufam text-lg text-foreground">
            {course.title}
          </h1>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>التقدم</span>
              <span>{enrollment.progress_percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${enrollment.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        <nav className="overflow-hidden rounded-2xl border border-border/80 bg-background/70 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
          <p className="border-b border-border/60 bg-primary/5 px-3 py-2.5 font-kufam text-sm text-foreground">
            الدروس
          </p>
          <ul className="max-h-[50vh] overflow-y-auto">
            {contents.map((item) => {
              const Icon = TYPE_ICON[item.type];
              const active = item.id === activeContentId;
              const done = completed.has(item.id);
              return (
                <li key={item.id}>
                  <Link
                    href={`/courses/${course.id}/learn/${item.id}`}
                    className={`flex items-start gap-2 px-3 py-3 text-sm transition ${
                      active
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {item.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {CONTENT_TYPE_LABELS[item.type]}
                      </span>
                    </span>
                    {done && (
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
          <p className="mb-2 text-sm text-muted-foreground">قيّم الدورة</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={pending}
                onClick={() => onRate(n)}
                className="rounded-lg px-2 py-1 text-sm transition hover:bg-muted disabled:opacity-40"
              >
                {n}★
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-4 rounded-3xl border border-border/70 bg-linear-to-b from-primary/5 to-transparent p-4 sm:p-6 md:p-8">
        {children}
        {activeContentId &&
          contents.find((c) => c.id === activeContentId)?.type !== "exam" && (
            <Button
              onClick={onComplete}
              disabled={pending || completed.has(activeContentId)}
            >
              {completed.has(activeContentId)
                ? "تم إكمال هذا الدرس"
                : pending
                  ? "جاري الحفظ…"
                  : "تعليم كمكتمل"}
            </Button>
          )}
      </div>
    </div>
  );
}
