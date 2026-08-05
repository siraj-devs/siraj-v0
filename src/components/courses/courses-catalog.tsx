"use client";

import type { CourseWithMeta } from "@/lib/course-types";
import { ENROLLMENT_STATUS_LABELS } from "@/lib/course-types";
import { Rosette } from "@/components/islamic-motif";
import { BookOpen, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CoursesCatalog({ courses }: { courses: CourseWithMeta[] }) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-kufam text-lg text-foreground">لا دورات منشورة بعد</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          ستظهر الدورات هنا عند نشرها من لوحة التحكم.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
      {courses.map((course, index) => (
        <li key={course.id}>
          <article className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-border/80 bg-background/60 px-6 py-10 text-center shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_60px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] md:px-8 md:py-12">
            <Rosette className="pointer-events-none absolute -right-6 -bottom-6 size-28 text-primary/5 transition-transform duration-500 group-hover:rotate-12" />

            <div className="relative mb-6">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  width={128}
                  height={128}
                  className="relative size-28 rounded-full border border-primary/20 object-cover transition-transform duration-300 group-hover:scale-105 md:size-32"
                />
              ) : (
                <div className="relative flex size-28 items-center justify-center rounded-full border border-primary/20 bg-muted text-muted-foreground md:size-32">
                  <BookOpen className="size-10 opacity-50" />
                </div>
              )}
            </div>

            <h3 className="relative mb-2 font-kufam text-2xl font-medium text-foreground md:text-3xl">
              {course.title}
            </h3>
            <p className="relative mb-4 line-clamp-3 max-w-sm text-base leading-8 text-foreground/70">
              {course.description}
            </p>

            <div className="relative mb-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-primary text-primary" />
                {course.rating_avg.toFixed(1)} ({course.rating_count})
              </span>
              <span>{course.lesson_count} دروس</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5">
                {ENROLLMENT_STATUS_LABELS[course.enrollment_status]}
              </span>
            </div>

            <Link
              href={`/courses/${course.id}`}
              className="relative inline-flex h-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 px-5 text-sm font-medium text-foreground transition hover:bg-primary/15"
            >
              عرض الدورة
            </Link>
            <span className="sr-only">{index + 1}</span>
          </article>
        </li>
      ))}
    </ul>
  );
}
