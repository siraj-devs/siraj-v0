"use client";

import {
  createProposedProgram,
  deleteProposedProgram,
  updateProposedProgram,
  type ProgramLinks,
  type ProposedProgram,
} from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type FormState = {
  name: string;
  description: string;
  order: string;
  telegram: string;
  website: string;
  facebook: string;
  twitter: string;
  instagram: string;
  whatsapp: string;
  youtube: string;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  order: "0",
  telegram: "",
  website: "",
  facebook: "",
  twitter: "",
  instagram: "",
  whatsapp: "",
  youtube: "",
});

function linksFromProgram(links: ProgramLinks): Pick<
  FormState,
  | "telegram"
  | "website"
  | "facebook"
  | "twitter"
  | "instagram"
  | "whatsapp"
  | "youtube"
> {
  return {
    telegram: links.telegram ?? "",
    website: links.website ?? "",
    facebook: links.facebook ?? "",
    twitter: links.twitter ?? "",
    instagram: links.instagram ?? "",
    whatsapp: links.whatsapp ?? "",
    youtube: links.youtube ?? "",
  };
}

const LINK_FIELDS = [
  { key: "telegram" as const, label: "تيليجرام" },
  { key: "website" as const, label: "الموقع" },
  { key: "facebook" as const, label: "فيسبوك" },
  { key: "twitter" as const, label: "X / تويتر" },
  { key: "instagram" as const, label: "إنستغرام" },
  { key: "whatsapp" as const, label: "واتساب" },
  { key: "youtube" as const, label: "يوتيوب" },
];

export function ContentManager({
  programs,
  canManage,
}: {
  programs: ProposedProgram[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId && !modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenuId(null);
      closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openMenuId, modal]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [programs, query]);

  const editing = programs.find((p) => p.id === editingId) ?? null;

  function openCreate() {
    if (!canManage) return;
    setForm({
      ...emptyForm(),
      order: String(programs.length),
    });
    setEditingId(null);
    setImageFile(null);
    setModal("create");
    setOpenMenuId(null);
  }

  function openEdit(program: ProposedProgram) {
    if (!canManage) return;
    setForm({
      name: program.name,
      description: program.description,
      order: String(program.order),
      ...linksFromProgram(program.links),
    });
    setEditingId(program.id);
    setImageFile(null);
    setModal("edit");
    setOpenMenuId(null);
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setForm(emptyForm());
    setImageFile(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;

    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("description", form.description);
    formData.set("order", form.order);
    formData.set("telegram", form.telegram);
    formData.set("website", form.website);
    formData.set("facebook", form.facebook);
    formData.set("twitter", form.twitter);
    formData.set("instagram", form.instagram);
    formData.set("whatsapp", form.whatsapp);
    formData.set("youtube", form.youtube);
    if (imageFile) formData.set("image", imageFile);
    if (modal === "edit" && editingId) formData.set("id", String(editingId));

    startTransition(async () => {
      const result =
        modal === "edit"
          ? await updateProposedProgram(formData)
          : await createProposedProgram(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(modal === "edit" ? "تم تحديث البرنامج" : "تم إضافة البرنامج");
      closeModal();
      router.refresh();
    });
  }

  function onDelete(id: number) {
    if (!canManage) return;
    if (!confirm("هل أنت متأكد من حذف هذا البرنامج؟")) return;

    startTransition(async () => {
      const result = await deleteProposedProgram(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف البرنامج");
      setOpenMenuId(null);
      router.refresh();
    });
  }

  const currentImage = previewUrl ?? editing?.image ?? null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-primary">إدارة الموقع</p>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              المحتوى
            </h1>
            <p className="max-w-lg text-foreground/65">
              إدارة البرامج المقترحة الظاهرة في الصفحة الرئيسية.
            </p>
          </div>

          {canManage && (
            <Button
              onClick={openCreate}
              className="shrink-0 gap-2 self-start md:self-auto"
            >
              <Plus className="size-4" />
              برنامج جديد
            </Button>
          )}
        </div>

        <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/40 bg-background px-4 py-3 shadow-sm">
            <p className="text-xs text-muted-foreground">البرامج المقترحة</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {programs.length}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">مع صورة</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {programs.filter((p) => p.image).length}
            </p>
          </div>
        </div>
      </header>

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو الوصف…"
          className="pr-10"
        />
      </div>

      {filtered.length > 0 ? (
        <ul className="space-y-3">
          {filtered.map((program) => (
            <li
              key={program.id}
              className="relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-4">
                {program.image ? (
                  <Image
                    src={program.image}
                    alt={program.name}
                    width={64}
                    height={64}
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted font-kufam text-lg text-muted-foreground">
                    {program.order + 1}
                  </div>
                )}
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-kufam text-lg text-foreground">
                      {program.name}
                    </h3>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      ترتيب {program.order}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-foreground/70">
                    {program.description}
                  </p>
                </div>
              </div>

              {canManage && (
                <div className="relative shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === program.id ? null : program.id,
                      )
                    }
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="خيارات"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                  {openMenuId === program.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute top-9 left-0 z-20 w-36 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => openEdit(program)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
                        >
                          <Pencil className="size-3.5" />
                          تعديل
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onDelete(program.id)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
                        >
                          <Trash2 className="size-3.5" />
                          حذف
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-20 text-center">
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {programs.length === 0
              ? "لم تُضف برامج مقترحة بعد."
              : "جرّب تغيير نص البحث."}
          </p>
          {canManage && programs.length === 0 && (
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="size-4" />
              إضافة برنامج
            </Button>
          )}
        </div>
      )}

      {canManage && modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={closeModal} aria-hidden />
          <form
            onSubmit={onSubmit}
            className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-6 sm:p-8 sm:pb-5">
              <div>
                <h2 className="font-kufam text-2xl font-semibold text-foreground">
                  {modal === "create" ? "برنامج جديد" : "تعديل البرنامج"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  الاسم، الوصف، الصورة، الروابط والترتيب.
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

            <div className="space-y-4 overflow-y-auto p-6 sm:p-8 sm:pt-5">
              <div className="space-y-2">
                <Label htmlFor="program-name">الاسم</Label>
                <Input
                  id="program-name"
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program-desc">الوصف</Label>
                <textarea
                  id="program-desc"
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program-order">الترتيب</Label>
                <Input
                  id="program-order"
                  type="number"
                  required
                  value={form.order}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, order: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program-image">الصورة</Label>
                {currentImage && (
                  <Image
                    src={currentImage}
                    alt=""
                    width={96}
                    height={96}
                    className="size-24 rounded-xl object-cover"
                  />
                )}
                <Input
                  id="program-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={(e) =>
                    setImageFile(e.target.files?.[0] ?? null)
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {LINK_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`link-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`link-${field.key}`}
                      type="url"
                      placeholder="https://"
                      value={form[field.key]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 border-t border-border p-6 sm:px-8">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={pending}
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
