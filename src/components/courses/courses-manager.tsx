"use client";

import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { LayoutToggle, type ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/courses/course-ui";
import type { CourseVisibility, CourseWithMeta } from "@/lib/course-types";
import {
  ENROLLMENT_STATUS_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/course-types";
import {
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_ORDER,
  type MemberRole,
} from "@/lib/member-role";
import {
  BookOpen,
  CircleHelp,
  Eye,
  EyeOff,
  Globe,
  ListVideo,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Unlock,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Rosette } from "@/components/islamic-motif";

export type CourseAclMemberOption = {
  id: number;
  name: string;
  role: MemberRole;
};

type CourseFilter = "all" | "published" | "hidden" | "open" | "private";

function CourseStatusBadges({
  course,
  size = "md",
}: {
  course: CourseWithMeta;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-0.5" : "px-3 py-1";
  const icon = size === "sm" ? "size-3" : "size-3.5";
  return (
    <>
      <span
        className={`inline-flex items-center gap-1 rounded-full text-xs font-medium ring-1 ring-inset ${pad} ${
          course.is_published
            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
            : "bg-amber-50 text-amber-800 ring-amber-200"
        }`}
      >
        {course.is_published ? (
          <Eye className={icon} />
        ) : (
          <EyeOff className={icon} />
        )}
        {course.is_published ? "منشور" : "مخفي"}
      </span>
      <span
        className={`inline-flex items-center gap-1 rounded-full text-xs font-medium ring-1 ring-inset ${pad} ${
          course.visibility === "private"
            ? "bg-violet-50 text-violet-800 ring-violet-200"
            : "bg-slate-50 text-slate-700 ring-slate-200"
        }`}
      >
        {course.visibility === "private" ? (
          <Shield className={icon} />
        ) : (
          <Globe className={icon} />
        )}
        {VISIBILITY_LABELS[course.visibility ?? "public"]}
      </span>
      <span
        className={`inline-flex items-center gap-1 rounded-full text-xs font-medium ring-1 ring-inset ${pad} ${
          course.enrollment_status === "open"
            ? "bg-sky-50 text-sky-800 ring-sky-200"
            : "bg-rose-50 text-rose-800 ring-rose-200"
        }`}
      >
        {course.enrollment_status === "open" ? (
          <Unlock className={icon} />
        ) : (
          <Lock className={icon} />
        )}
        {ENROLLMENT_STATUS_LABELS[course.enrollment_status]}
      </span>
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

function CourseActionsMenu({
  course,
  open,
  onToggle,
  onClose,
  onEdit,
  onDelete,
  pending,
  buttonClassName,
  placement = "down",
}: {
  course: CourseWithMeta;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  pending?: boolean;
  buttonClassName?: string;
  placement?: "up" | "down";
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={
          buttonClassName ??
          "rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        }
        aria-label="خيارات الدورة"
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 size-screen" onClick={onClose} />
          <div
            className={`absolute left-0 z-50 w-40 overflow-hidden rounded-xl border border-border bg-background shadow-lg ${
              placement === "up"
                ? "bottom-full mb-1"
                : "top-full mt-1"
            }`}
          >
            <Link
              href={`/dashboard/courses/${course.id}`}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
              onClick={onClose}
            >
              <ListVideo className="size-3.5" />
              المحتوى
            </Link>
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
            >
              <Pencil className="size-3.5" />
              تعديل
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onDelete}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
              حذف
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function CoursesManager({
  courses,
  members = [],
}: {
  courses: CourseWithMeta[];
  members?: CourseAclMemberOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<CourseWithMeta | null>(null);
  const [deleting, setDeleting] = useState<CourseWithMeta | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState<"open" | "closed">(
    "closed",
  );
  const [isPublished, setIsPublished] = useState(false);
  const [visibility, setVisibility] = useState<CourseVisibility>("public");
  const [allowedRoles, setAllowedRoles] = useState<MemberRole[]>([]);
  const [allowedMemberIds, setAllowedMemberIds] = useState<number[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CourseFilter>("all");
  const [layout, setLayout] = useState<ViewLayout>("grid");

  const counts = useMemo(
    () => ({
      all: courses.length,
      published: courses.filter((c) => c.is_published).length,
      hidden: courses.filter((c) => !c.is_published).length,
      open: courses.filter((c) => c.enrollment_status === "open").length,
      private: courses.filter((c) => c.visibility === "private").length,
    }),
    [courses],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (filter === "published" && !course.is_published) return false;
      if (filter === "hidden" && course.is_published) return false;
      if (filter === "open" && course.enrollment_status !== "open") return false;
      if (filter === "private" && course.visibility !== "private") return false;
      if (!q) return true;
      return (
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q)
      );
    });
  }, [courses, filter, query]);

  useEffect(() => {
    if (!modal && !openMenuId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenuId(null);
      if (!pending) closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, openMenuId, pending]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setEnrollmentStatus("closed");
    setIsPublished(false);
    setVisibility("public");
    setAllowedRoles([]);
    setAllowedMemberIds([]);
    setThumbnail(null);
    setModal("create");
  }

  function openEdit(course: CourseWithMeta) {
    setEditing(course);
    setTitle(course.title);
    setDescription(course.description);
    setEnrollmentStatus(course.enrollment_status);
    setIsPublished(course.is_published);
    setVisibility(course.visibility ?? "public");
    setAllowedRoles(course.allowed_roles ?? []);
    setAllowedMemberIds(course.allowed_member_ids ?? []);
    setThumbnail(null);
    setOpenMenuId(null);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  function toggleRole(role: MemberRole) {
    setAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function toggleMember(id: number) {
    setAllowedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("enrollment_status", enrollmentStatus);
    formData.set("is_published", isPublished ? "true" : "false");
    formData.set("visibility", visibility);
    for (const role of allowedRoles) formData.append("allowed_roles", role);
    for (const id of allowedMemberIds) {
      formData.append("allowed_member_ids", String(id));
    }
    if (thumbnail) formData.set("thumbnail", thumbnail);
    if (editing) formData.set("id", String(editing.id));

    startTransition(async () => {
      const result =
        modal === "edit"
          ? await updateCourse(formData)
          : await createCourse(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(modal === "edit" ? "تم تحديث الدورة" : "تم إنشاء الدورة");
      closeModal();
      if (modal === "create" && "id" in result) {
        router.push(`/dashboard/courses/${result.id}`);
      }
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteCourse(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف الدورة");
      setDeleting(null);
      router.refresh();
    });
  }

  const filterChips: { key: CourseFilter; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "published", label: "منشور" },
    { key: "hidden", label: "مخفي" },
    { key: "open", label: "تسجيل مفتوح" },
    { key: "private", label: "خاص" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-primary">إدارة التعلم</p>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              الدورات
            </h1>
            <p className="max-w-lg text-foreground/65">
              أنشئ الدورات ونظّم الدروس والاختبارات وظهورها للزوار.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="shrink-0 gap-2 self-start md:self-auto"
          >
            <Plus className="size-4" />
            دورة جديدة
          </Button>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(
            [
              ["all", "الإجمالي", counts.all],
              ["published", "منشور", counts.published],
              ["hidden", "مخفي", counts.hidden],
              ["open", "تسجيل مفتوح", counts.open],
              ["private", "خاص", counts.private],
            ] as const
          ).map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-2xl border px-4 py-3 text-start transition-all ${
                filter === key
                  ? "border-primary/40 bg-background shadow-sm"
                  : "border-transparent bg-background/50 hover:border-border"
              }`}
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-kufam text-2xl text-foreground">{value}</p>
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالعنوان أو الوصف…"
            className="pr-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  filter === chip.key
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground/70 hover:bg-muted/80"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <LayoutToggle value={layout} onChange={setLayout} />
        </div>
      </div>

      {filtered.length > 0 ? (
        layout === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((course) => (
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
                    <CourseActionsMenu
                      course={course}
                      open={openMenuId === course.id}
                      onToggle={() =>
                        setOpenMenuId(
                          openMenuId === course.id ? null : course.id,
                        )
                      }
                      onClose={() => setOpenMenuId(null)}
                      onEdit={() => openEdit(course)}
                      onDelete={() => {
                        setOpenMenuId(null);
                        setDeleting(course);
                      }}
                      pending={pending}
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
                    <StarRating
                      value={course.rating_avg}
                      count={course.rating_count}
                    />
                  </div>

                  <p className="line-clamp-2 text-center text-sm text-foreground/65">
                    {course.description}
                  </p>
                  <div className="mt-auto pt-4">
                    <CourseCardMeta
                      course={course}
                      className="justify-center"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((course) => (
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
                  <CourseActionsMenu
                    course={course}
                    open={openMenuId === course.id}
                    onToggle={() =>
                      setOpenMenuId(
                        openMenuId === course.id ? null : course.id,
                      )
                    }
                    onClose={() => setOpenMenuId(null)}
                    onEdit={() => openEdit(course)}
                    onDelete={() => {
                      setOpenMenuId(null);
                      setDeleting(course);
                    }}
                    pending={pending}
                    placement="up"
                  />
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {courses.length === 0
              ? "ابدأ بإنشاء أول دورة لتظهر هنا وعند النشر للزوار."
              : "جرّب تغيير نص البحث أو التصفية."}
          </p>
          {courses.length === 0 && (
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="size-4" />
              إنشاء دورة
            </Button>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف الدورة"
        description={
          deleting ? `هل تريد حذف «${deleting.title}» وكل دروسها؟` : ""
        }
        confirmLabel="حذف"
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onConfirmDelete}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            className="absolute inset-0"
            onClick={() => !pending && closeModal()}
          />
          <form
            onSubmit={onSubmit}
            className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-background p-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-kufam text-2xl font-semibold">
                  {modal === "create" ? "دورة جديدة" : "تعديل الدورة"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  العنوان، الوصف، الخصوصية، التسجيل، والظهور.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-title">العنوان</Label>
                <Input
                  id="course-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-desc">الوصف</Label>
                <textarea
                  id="course-desc"
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">الخصوصية</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["public", "private"] as const).map((value) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        visibility === value
                          ? "border-primary/40 bg-primary/10"
                          : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        checked={visibility === value}
                        onChange={() => setVisibility(value)}
                      />
                      {VISIBILITY_LABELS[value]}
                    </label>
                  ))}
                </div>
              </fieldset>
              {visibility === "private" && (
                <>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      الأدوار المسموحة
                    </legend>
                    <p className="text-xs text-muted-foreground">
                      من لديه أحد هذه الأدوار يمكنه رؤية الدورة (أو الأعضاء
                      المحددين أدناه).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {MEMBER_ROLE_ORDER.map((role) => (
                        <label
                          key={role}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                            allowedRoles.includes(role)
                              ? "border-violet-400 bg-violet-50 text-violet-900"
                              : "border-border text-foreground/70"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={allowedRoles.includes(role)}
                            onChange={() => toggleRole(role)}
                          />
                          {MEMBER_ROLE_LABELS[role]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      أعضاء محددون
                    </legend>
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                      {members.length === 0 ? (
                        <p className="px-2 py-3 text-xs text-muted-foreground">
                          لا أعضاء متاحون للاختيار.
                        </p>
                      ) : (
                        members.map((m) => (
                          <label
                            key={m.id}
                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted ${
                              allowedMemberIds.includes(m.id)
                                ? "bg-violet-50"
                                : ""
                            }`}
                          >
                            <span className="truncate">
                              {m.name}
                              <span className="ms-2 text-xs text-muted-foreground">
                                {MEMBER_ROLE_LABELS[m.role]}
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              checked={allowedMemberIds.includes(m.id)}
                              onChange={() => toggleMember(m.id)}
                            />
                          </label>
                        ))
                      )}
                    </div>
                  </fieldset>
                </>
              )}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">التسجيل</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["open", "closed"] as const).map((status) => (
                    <label
                      key={status}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        enrollmentStatus === status
                          ? "border-primary/40 bg-primary/10"
                          : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="enrollment"
                        checked={enrollmentStatus === status}
                        onChange={() => setEnrollmentStatus(status)}
                      />
                      {ENROLLMENT_STATUS_LABELS[status]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">الظهور</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      isPublished
                        ? "border-primary/40 bg-primary/10"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={isPublished}
                      onChange={() => setIsPublished(true)}
                    />
                    منشور
                  </label>
                  <label
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      !isPublished ? "border-border bg-muted" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={!isPublished}
                      onChange={() => setIsPublished(false)}
                    />
                    مخفي
                  </label>
                </div>
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="course-thumb">الصورة</Label>
                <Input
                  id="course-thumb"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? "جاري الحفظ…" : "حفظ"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
