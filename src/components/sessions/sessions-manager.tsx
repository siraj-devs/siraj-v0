"use client";

import {
  createSeries,
  createSession,
  deleteSeries,
  deleteSession,
  setSessionPublished,
  updateSession,
  type ClubSession,
  type SessionSeries,
} from "@/app/actions/sessions";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { SessionFormDialog, type SessionFormState } from "./session-form-dialog";
import { SessionList } from "./session-list";

type StatusFilter = "all" | "published" | "draft";

const emptyForm = (): SessionFormState => ({
  title: "",
  due_date: "",
  record_link: "",
  series_id: "",
  is_published: false,
});

export function SessionsManager({
  sessions,
  series,
  canManage,
}: {
  sessions: ClubSession[];
  series: SessionSeries[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [deleting, setDeleting] = useState<ClubSession | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [seriesList, setSeriesList] = useState(series);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [layout, setLayout] = useState<ViewLayout>("grid");

  useEffect(() => {
    setSeriesList(series);
  }, [series]);

  useEffect(() => {
    if (!openMenuId && !modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenuId(null);
      if (!pending) closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openMenuId, modal, pending]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const counts = useMemo(
    () => ({
      all: sessions.length,
      published: sessions.filter((s) => s.is_published).length,
      draft: sessions.filter((s) => !s.is_published).length,
    }),
    [sessions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter === "published" && !s.is_published) return false;
      if (statusFilter === "draft" && s.is_published) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.series?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [sessions, query, statusFilter]);

  const editing = sessions.find((s) => s.id === editingId) ?? null;

  function openCreate() {
    if (!canManage) return;
    setForm(emptyForm());
    setEditingId(null);
    setImageFile(null);
    setNewSeriesName("");
    setModal("create");
    setOpenMenuId(null);
  }

  function openEdit(session: ClubSession) {
    if (!canManage) return;
    setForm({
      title: session.title,
      due_date: session.due_date.slice(0, 10),
      record_link: session.record_link,
      series_id: session.series_id ?? "",
      is_published: session.is_published,
    });
    setEditingId(session.id);
    setImageFile(null);
    setNewSeriesName("");
    setModal("edit");
    setOpenMenuId(null);
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setForm(emptyForm());
    setImageFile(null);
    setNewSeriesName("");
  }

  function onCreateSeries() {
    if (!canManage || !newSeriesName.trim()) return;
    startTransition(async () => {
      const result = await createSeries(newSeriesName);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSeriesList((prev) =>
        [...prev, result.series].sort((a, b) =>
          a.name.localeCompare(b.name, "ar"),
        ),
      );
      setForm((f) => ({ ...f, series_id: result.series.id }));
      setNewSeriesName("");
      toast.success("تم إنشاء السلسلة");
    });
  }

  function onDeleteSeries(id: string) {
    if (!canManage) return;
    startTransition(async () => {
      const result = await deleteSeries(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSeriesList((prev) => prev.filter((s) => s.id !== id));
      if (form.series_id === id) {
        setForm((f) => ({ ...f, series_id: "" }));
      }
      toast.success("تم حذف السلسلة");
      router.refresh();
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;

    const formData = new FormData();
    formData.set("title", form.title);
    formData.set("due_date", form.due_date);
    formData.set("record_link", form.record_link);
    formData.set("series_id", form.series_id);
    formData.set("is_published", form.is_published ? "true" : "false");
    if (imageFile) formData.set("thumbnail", imageFile);
    if (modal === "edit" && editingId) formData.set("id", editingId);

    startTransition(async () => {
      const result =
        modal === "edit"
          ? await updateSession(formData)
          : await createSession(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(modal === "edit" ? "تم تحديث الأمسية" : "تم إضافة الأمسية");
      closeModal();
      router.refresh();
    });
  }

  function onTogglePublish(session: ClubSession) {
    if (!canManage) return;
    startTransition(async () => {
      const result = await setSessionPublished(
        session.id,
        !session.is_published,
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        session.is_published ? "تم إخفاء الأمسية" : "تم نشر الأمسية",
      );
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!canManage || !deleting) return;
    startTransition(async () => {
      const result = await deleteSession(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف الأمسية");
      setDeleting(null);
      router.refresh();
    });
  }

  const currentImage = previewUrl ?? editing?.thumbnail ?? null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <DashboardHeader
        eyebrow="إدارة المحتوى"
        title="الأمسيات"
        description="أنشئ الأمسيات، أرفق تسجيل يوتيوب، ونظّم السلاسل وظهورها للأعضاء."
        action={
          canManage && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              أمسية جديدة
            </Button>
          )
        }
        stats={[
          { key: "all", label: "الإجمالي", value: counts.all },
          { key: "published", label: "منشور", value: counts.published },
          { key: "draft", label: "مخفي", value: counts.draft },
        ]}
        activeStat={statusFilter}
        onStatClick={setStatusFilter}
      />

      <DashboardToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="ابحث بالعنوان أو السلسلة…"
        filters={[
          { key: "all", label: "الكل" },
          { key: "published", label: "منشور" },
          { key: "draft", label: "مخفي" },
        ]}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <SessionList
        sessions={filtered}
        allSessionsCount={sessions.length}
        layout={layout}
        canManage={canManage}
        openMenuId={openMenuId}
        onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
        onCloseMenu={() => setOpenMenuId(null)}
        onEdit={openEdit}
        onTogglePublish={onTogglePublish}
        onDelete={setDeleting}
        onCreate={openCreate}
      />

      {modal && (
        <SessionFormDialog
          mode={modal}
          form={form}
          onFormChange={setForm}
          seriesList={seriesList}
          newSeriesName={newSeriesName}
          onNewSeriesNameChange={setNewSeriesName}
          onCreateSeries={onCreateSeries}
          onDeleteSeries={onDeleteSeries}
          currentImage={currentImage}
          onImageChange={setImageFile}
          pending={pending}
          onClose={closeModal}
          onSubmit={onSubmit}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleting}
        title="حذف الأمسية"
        description={
          deleting
            ? `هل تريد حذف «${deleting.title}»؟ لا يمكن التراجع عن هذا الإجراء.`
            : ""
        }
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
