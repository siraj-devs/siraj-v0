"use client";

import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { Button } from "@/components/ui/button";
import type { CourseAclMemberOption, CourseWithMeta } from "@/lib/course-types";
import type { MemberRole } from "@/lib/member-role";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CourseFormDialog, type CourseFormState } from "./course-form-dialog";
import { CourseList } from "./course-list";

export type { CourseAclMemberOption };

type CourseFilter = "all" | "published" | "hidden" | "open" | "private";

const emptyForm = (): CourseFormState => ({
  title: "",
  description: "",
  enrollmentStatus: "closed",
  isPublished: false,
  visibility: "public",
  allowedRoles: [],
  allowedMemberIds: [],
});

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
  const [form, setForm] = useState<CourseFormState>(emptyForm);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CourseFilter>("all");
  const [layout, setLayout] = useState<"list" | "grid">("grid");

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
    setForm(emptyForm());
    setThumbnail(null);
    setModal("create");
  }

  function openEdit(course: CourseWithMeta) {
    setEditing(course);
    setForm({
      title: course.title,
      description: course.description,
      enrollmentStatus: course.enrollment_status,
      isPublished: course.is_published,
      visibility: course.visibility ?? "public",
      allowedRoles: course.allowed_roles ?? [],
      allowedMemberIds: course.allowed_member_ids ?? [],
    });
    setThumbnail(null);
    setOpenMenuId(null);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  function setFormField<K extends keyof CourseFormState>(
    key: K,
    value: CourseFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleRole(role: MemberRole) {
    setForm((f) => ({
      ...f,
      allowedRoles: f.allowedRoles.includes(role)
        ? f.allowedRoles.filter((r) => r !== role)
        : [...f.allowedRoles, role],
    }));
  }

  function toggleMember(id: number) {
    setForm((f) => ({
      ...f,
      allowedMemberIds: f.allowedMemberIds.includes(id)
        ? f.allowedMemberIds.filter((m) => m !== id)
        : [...f.allowedMemberIds, id],
    }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("title", form.title);
    formData.set("description", form.description);
    formData.set("enrollment_status", form.enrollmentStatus);
    formData.set("is_published", form.isPublished ? "true" : "false");
    formData.set("visibility", form.visibility);
    for (const role of form.allowedRoles) formData.append("allowed_roles", role);
    for (const id of form.allowedMemberIds) {
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <DashboardHeader
        eyebrow="إدارة التعلم"
        title="الدورات"
        description="أنشئ الدورات ونظّم الدروس والاختبارات وظهورها للزوار."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            دورة جديدة
          </Button>
        }
        statsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        stats={[
          { key: "all", label: "الإجمالي", value: counts.all },
          { key: "published", label: "منشور", value: counts.published },
          { key: "hidden", label: "مخفي", value: counts.hidden },
          { key: "open", label: "تسجيل مفتوح", value: counts.open },
          { key: "private", label: "خاص", value: counts.private },
        ]}
        activeStat={filter}
        onStatClick={setFilter}
      />

      <DashboardToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="ابحث بالعنوان أو الوصف…"
        filters={[
          { key: "all", label: "الكل" },
          { key: "published", label: "منشور" },
          { key: "hidden", label: "مخفي" },
          { key: "open", label: "تسجيل مفتوح" },
          { key: "private", label: "خاص" },
        ]}
        activeFilter={filter}
        onFilterChange={setFilter}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <CourseList
        courses={filtered}
        allCoursesCount={courses.length}
        layout={layout}
        openMenuId={openMenuId}
        onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
        onCloseMenu={() => setOpenMenuId(null)}
        onEdit={openEdit}
        onDelete={(course) => {
          setOpenMenuId(null);
          setDeleting(course);
        }}
        onCreate={openCreate}
        pending={pending}
      />

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
        <CourseFormDialog
          mode={modal}
          form={form}
          onFieldChange={setFormField}
          onToggleRole={toggleRole}
          onToggleMember={toggleMember}
          members={members}
          onThumbnailChange={setThumbnail}
          pending={pending}
          onClose={closeModal}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
