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
import { Rosette } from "@/components/islamic-motif";
import { LayoutToggle, type ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSessionDueDate } from "@/lib/session-date";
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type FormState = {
  title: string;
  due_date: string;
  record_link: string;
  series_id: string;
  is_published: boolean;
};

type StatusFilter = "all" | "published" | "draft";

const emptyForm = (): FormState => ({
  title: "",
  due_date: "",
  record_link: "",
  series_id: "",
  is_published: false,
});

function PublishBadge({
  published,
  size = "md",
}: {
  published: boolean;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-0.5" : "px-3 py-1";
  const icon = size === "sm" ? "size-3" : "size-3.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-xs font-medium ring-1 ring-inset ${pad} ${
        published
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-amber-50 text-amber-800 ring-amber-200"
      }`}
    >
      {published ? <Eye className={icon} /> : <EyeOff className={icon} />}
      {published ? "منشور" : "مخفي"}
    </span>
  );
}

function SessionThumb({
  session,
  className,
}: {
  session: ClubSession;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-muted/12 ${className ?? "aspect-video"}`}
    >
      {session.thumbnail ? (
        <Image
          src={session.thumbnail}
          alt={session.title}
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
  );
}

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
  const [form, setForm] = useState<FormState>(emptyForm);
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

  const filterChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "published", label: "منشور" },
    { key: "draft", label: "مخفي" },
  ];

  function ActionsMenu({
    session,
    placement = "down",
    buttonClassName,
  }: {
    session: ClubSession;
    placement?: "up" | "down";
    buttonClassName?: string;
  }) {
    const open = openMenuId === session.id;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenuId(open ? null : session.id)}
          className={
            buttonClassName ??
            "rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          }
          aria-label="خيارات الأمسية"
        >
          <MoreHorizontal className="size-5" />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpenMenuId(null)}
            />
            <div
              className={`absolute left-0 z-50 w-40 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg ${
                placement === "up" ? "bottom-full mb-1" : "top-full mt-1"
              }`}
            >
              <button
                type="button"
                onClick={() => openEdit(session)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
              >
                <Pencil className="size-3.5" />
                تعديل
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setOpenMenuId(null);
                  onTogglePublish(session);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted disabled:opacity-40"
              >
                {session.is_published ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                {session.is_published ? "إخفاء" : "نشر"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setOpenMenuId(null);
                  setDeleting(session);
                }}
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-primary">إدارة المحتوى</p>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              الأمسيات
            </h1>
            <p className="max-w-lg text-foreground/65">
              أنشئ الأمسيات، أرفق تسجيل يوتيوب، ونظّم السلاسل وظهورها للأعضاء.
            </p>
          </div>
          {canManage && (
            <Button
              onClick={openCreate}
              className="shrink-0 gap-2 self-start md:self-auto"
            >
              <Plus className="size-4" />
              أمسية جديدة
            </Button>
          )}
        </div>

        <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              ["all", "الإجمالي", counts.all],
              ["published", "منشور", counts.published],
              ["draft", "مخفي", counts.draft],
            ] as const
          ).map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-2xl border px-4 py-3 text-start transition-all ${
                statusFilter === key
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
            placeholder="ابحث بالعنوان أو السلسلة…"
            className="pr-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  statusFilter === chip.key
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
            {filtered.map((session) => (
              <article
                key={session.id}
                className={`group relative flex flex-col rounded-3xl border border-border/80 bg-background/70 p-3 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] ${
                  openMenuId === session.id ? "z-50" : "z-0"
                } ${!session.is_published ? "opacity-75" : ""}`}
              >
                <div className="relative">
                  <SessionThumb session={session} />
                  {canManage && (
                    <div className="absolute top-2 left-2 z-20">
                      <ActionsMenu
                        session={session}
                        buttonClassName="rounded-lg bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
                      />
                    </div>
                  )}
                </div>

                <div className="relative flex flex-1 flex-col items-center px-2 pb-2 pt-4">
                  <h3 className="mb-2 text-center font-kufam text-xl font-medium text-foreground">
                    {session.title}
                  </h3>
                  <div className="mb-2 flex flex-wrap justify-center gap-1.5">
                    <PublishBadge published={session.is_published} />
                    {session.series && (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground ring-1 ring-inset ring-border/70">
                        {session.series.name}
                      </span>
                    )}
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    {formatSessionDueDate(session.due_date)}
                  </p>
                  <Link
                    href={session.record_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto line-clamp-1 pt-3 text-center text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    يوتيوب
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((session) => (
              <li
                key={session.id}
                className={`relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
                  openMenuId === session.id ? "z-50" : "z-0"
                } ${!session.is_published ? "opacity-75" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">
                    {session.thumbnail ? (
                      <Image
                        src={session.thumbnail}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="112px"
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
                        {session.title}
                      </h3>
                      <PublishBadge published={session.is_published} size="sm" />
                      {session.series && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {session.series.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatSessionDueDate(session.due_date)}
                    </p>
                    <Link
                      href={session.record_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {session.record_link}
                    </Link>
                  </div>
                </div>

                {canManage && (
                  <div className="relative shrink-0 self-end sm:self-center">
                    <ActionsMenu session={session} placement="up" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <Rosette className="mb-4 size-10 text-primary/25" />
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {sessions.length === 0
              ? "ابدأ بإنشاء أول أمسية لتظهر هنا وعند النشر للأعضاء."
              : "جرّب تغيير نص البحث أو التصفية."}
          </p>
          {canManage && sessions.length === 0 && (
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="size-4" />
              إنشاء أمسية
            </Button>
          )}
        </div>
      )}

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
                  {modal === "create" ? "أمسية جديدة" : "تعديل الأمسية"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  العنوان، التاريخ، رابط يوتيوب، والصورة المصغّرة.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="إغلاق"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-title">العنوان</Label>
                <Input
                  id="session-title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-due-date">التاريخ</Label>
                <Input
                  id="session-due-date"
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, due_date: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-record">رابط يوتيوب</Label>
                <Input
                  id="session-record"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={form.record_link}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, record_link: e.target.value }))
                  }
                  required
                  dir="ltr"
                  className="text-left"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-series">السلسلة</Label>
                <select
                  id="session-series"
                  value={form.series_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, series_id: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">بدون سلسلة</option>
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Input
                    value={newSeriesName}
                    onChange={(e) => setNewSeriesName(e.target.value)}
                    placeholder="سلسلة جديدة…"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending || !newSeriesName.trim()}
                    onClick={onCreateSeries}
                  >
                    إضافة
                  </Button>
                </div>
                {form.series_id && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onDeleteSeries(form.series_id)}
                    className="text-xs text-destructive hover:underline disabled:opacity-40"
                  >
                    حذف السلسلة المحددة
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-thumb">الصورة المصغّرة</Label>
                {currentImage && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border">
                    <Image
                      src={currentImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  </div>
                )}
                <Input
                  id="session-thumb"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      is_published: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-border"
                />
                نشر الأمسية
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={pending}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={pending}>
                  {modal === "create" ? "إنشاء" : "حفظ"}
                </Button>
              </div>
            </div>
          </form>
        </div>
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
