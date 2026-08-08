"use client";

import { MetaChip, StarRating } from "@/components/courses/course-ui";
import { Rosette } from "@/components/islamic-motif";
import type { CourseWithMeta } from "@/lib/course-types";
import { BookOpen, GraduationCap, HelpCircle, Lock, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CoursesCatalog({
  courses,
  enrolledCourseIds = [],
}: {
  courses: CourseWithMeta[];
  enrolledCourseIds?: number[];
}) {
  const enrolled = new Set(enrolledCourseIds);

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <Rosette className="mb-4 size-10 text-primary/25" />
        <p className="font-kufam text-lg text-foreground">لا دورات منشورة بعد</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          ستظهر الدورات هنا عند نشرها من لوحة التحكم.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
      {courses.map((course) => {
        const closed = course.enrollment_status !== "open";
        const isEnrolled = enrolled.has(course.id);
        return (
          <li key={course.id}>
            <Link
              href={
                isEnrolled
                  ? `/courses/${course.id}/learn`
                  : `/courses/${course.id}`
              }
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-background/80 p-3 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_10%,transparent)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_22px_60px_-30px_color-mix(in_oklch,var(--primary)_35%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted/12">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-linear-to-b from-primary/5 to-primary/2 text-primary/35">
                    <Rosette className="size-16" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background/35 to-transparent" />
                {closed && (
                  <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 ring-1 ring-inset ring-rose-200 backdrop-blur">
                    <Lock className="size-3" />
                   مغلق
                  </span>
                )}
                {course.visibility === "private" && (
                  <span
                    className={`absolute top-3 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-800 ring-1 ring-inset ring-violet-200 backdrop-blur ${
                      closed ? "start-3" : "end-3"
                    }`}
                  >
                    <Shield className="size-3" />
                    خاص
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 px-2 pb-2 pt-4">
                <h3 className="font-kufam text-xl font-medium leading-8 text-foreground">
                  {course.title}
                </h3>

                <StarRating
                  value={course.rating_avg}
                  count={course.rating_count}
                />

                <p className="line-clamp-2 text-sm leading-7 text-foreground/65">
                  {course.description}
                </p>

                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <MetaChip icon={BookOpen}>
                    الدروس: {course.lesson_count}
                  </MetaChip>
                  <MetaChip icon={HelpCircle}>
                    الاختبارات: {course.exam_count}
                  </MetaChip>
                </div>

                <span className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-all group-hover:brightness-110">
                  {isEnrolled
                    ? "متابعة التعلم"
                    : closed
                      ? "عرض الدورة"
                      : "الإلتحاق الآن"}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
