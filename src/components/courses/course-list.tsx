"use client";

import { Rosette } from "@/components/islamic-motif";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import {
  KebabMenu,
  type KebabMenuItem,
} from "@/components/dashboard/kebab-menu";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { CourseWithMeta } from "@/lib/course-types";
import { ENROLLMENT_STATUS_LABELS, VISIBILITY_LABELS } from "@/lib/course-types";
import {
  BookOpen,
  CircleHelp,
  Eye,
  EyeOff,
  Globe,
  ListVideo,
  Lock,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import Image from "next/image";
import { StarRating } from "./course-ui";

function CourseStatusBadges({
  course,
  size = "md",
}: {
  course: CourseWithMeta;
  size?: "sm" | "md";
}) {
  const icon = size === "sm" ? "size-3" : "size-3.5";
  return (
    <>
      <StatusBadge
        tone={course.is_published ? "emerald" : "amber"}
        icon={
          course.is_published ? (
            <Eye className={icon} />
          ) : (
            <EyeOff className={icon} />
          )
        }
        label={course.is_published ? "منشور" : "مخفي"}
        size={size}
      />
      <StatusBadge
        tone={course.visibility === "private" ? "violet" : "slate"}
        icon={
          course.visibility === "private" ? (
            <Shield className={icon} />
          ) : (
            <Globe className={icon} />
          )
        }
        label={VISIBILITY_LABELS[course.visibility ?? "public"]}
        size={size}
      />
      <StatusBadge
        tone={course.enrollment_status === "open" ? "sky" : "rose"}
        icon={
          course.enrollment_status === "open" ? (
            <Unlock className={icon} />
          ) : (
            <Lock className={icon} />
          )
        }
        label={ENROLLMENT_STATUS_LABELS[course.enrollment_status]}
        size={size}
      />
    </>
  );
}

function CourseCardMeta({
  course,
  className,
}: {
  course: CourseWithMeta;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground ${className ?? ""}`}
    >
      <span className="inline-flex items-center gap-1">
        <BookOpen className="size-3.5" />
        {course.lesson_count} دروس
      </span>
      <span className="inline-flex items-center gap-1">
        <CircleHelp className="size-3.5" />
        {course.exam_count} اختبارات
      </span>
      <span className="inline-flex items-center gap-1">
        <Users className="size-3.5" />
        {course.enrollment_count} ملتحق
      </span>
    </div>
  );
}

export function CourseList({
  courses,
  allCoursesCount,
  layout,
  openMenuId,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDelete,
  onCreate,
  pending,
}: {
  courses: CourseWithMeta[];
  allCoursesCount: number;
  layout: ViewLayout;
  openMenuId: number | null;
  onToggleMenu: (id: number) => void;
  onCloseMenu: () => void;
  onEdit: (course: CourseWithMeta) => void;
  onDelete: (course: CourseWithMeta) => void;
  onCreate: () => void;
  pending: boolean;
}) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-kufam text-lg text-foreground">لا نتائج</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {allCoursesCount === 0
            ? "ابدأ بإنشاء أول دورة لتظهر هنا وعند النشر للزوار."
            : "جرّب تغيير نص البحث أو التصفية."}
        </p>
        {allCoursesCount === 0 && (
          <Button onClick={onCreate} className="mt-6 gap-2">
            <Plus className="size-4" />
            إنشاء دورة
          </Button>
        )}
      </div>
    );
  }

  function itemsFor(course: CourseWithMeta): KebabMenuItem[] {
    return [
      {
        key: "content",
        label: "المحتوى",
        icon: <ListVideo className="size-3.5" />,
        href: `/dashboard/courses/${course.id}`,
      },
      {
        key: "edit",
        label: "تعديل",
        icon: <Pencil className="size-3.5" />,
        onClick: () => onEdit(course),
      },
      {
        key: "delete",
        label: "حذف",
        icon: <Trash2 className="size-3.5" />,
        variant: "destructive",
        disabled: pending,
        onClick: () => onDelete(course),
      },
    ];
  }

  if (layout === "list") {
    return (
      <ul className="space-y-3">
        {courses.map((course) => (
          <li
            key={course.id}
            className={`relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
              openMenuId === course.id ? "z-50" : "z-0"
            } ${!course.is_published ? "opacity-75" : ""}`}
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-linear-to-b from-primary/5 to-primary/2 text-primary/35">
                    <Rosette className="size-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-kufam text-lg text-foreground">
                    {course.title}
                  </h3>
                  <CourseStatusBadges course={course} size="sm" />
                </div>
                <p className="line-clamp-1 text-sm text-foreground/65">
                  {course.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StarRating
                    value={course.rating_avg}
                    count={course.rating_count}
                  />
                  <CourseCardMeta course={course} />
                </div>
              </div>
            </div>

            <div className="relative shrink-0 self-end sm:self-center">
              <ListRowActions
                items={itemsFor(course)}
                open={openMenuId === course.id}
                onToggle={() => onToggleMenu(course.id)}
                onClose={onCloseMenu}
                menuPlacement="up"
                ariaLabel="خيارات الدورة"
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {courses.map((course) => (
        <article
          key={course.id}
          className={`group relative flex flex-col rounded-3xl border border-border/80 bg-background/70 p-3 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] ${
            openMenuId === course.id ? "z-50" : "z-0"
          } ${!course.is_published ? "opacity-75" : ""}`}
        >
          <div className="relative">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted/12">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-linear-to-b from-primary/5 to-primary/2 text-primary/35">
                  <Rosette className="size-14" />
                </div>
              )}
            </div>

            <div className="absolute top-2 left-2 z-20">
              <KebabMenu
                items={itemsFor(course)}
                open={openMenuId === course.id}
                onToggle={() => onToggleMenu(course.id)}
                onClose={onCloseMenu}
                placement="down"
                ariaLabel="خيارات الدورة"
                buttonClassName="rounded-lg bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
              />
            </div>
          </div>

          <div className="relative flex flex-1 flex-col items-center px-2 pb-2 pt-4">
            <h3 className="mb-2 text-center font-kufam text-xl font-medium text-foreground">
              {course.title}
            </h3>

            <div className="mb-2 flex flex-wrap justify-center gap-1.5">
              <CourseStatusBadges course={course} />
            </div>

            <div className="mb-3">
              <StarRating value={course.rating_avg} count={course.rating_count} />
            </div>

            <p className="line-clamp-2 text-center text-sm text-foreground/65">
              {course.description}
            </p>
            <div className="mt-auto pt-4">
              <CourseCardMeta course={course} className="justify-center" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
