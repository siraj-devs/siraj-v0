"use client";

import {
  deleteSocialLink,
  upsertSocialLink,
} from "@/app/actions/socials";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { LayoutToggle, type ViewLayout } from "@/components/layout-toggle";
import { SocialIcon } from "@/components/social-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSocialDisplayName,
  SOCIAL_PLATFORM_OPTIONS,
  type SocialLabel,
  type SocialLink,
} from "@/lib/social-platforms";
import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

export function SocialsManager({
  socials,
  canManage,
}: {
  socials: SocialLink[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [label, setLabel] = useState<SocialLabel>("instagram");
  const [link, setLink] = useState("");
  const [openMenuLabel, setOpenMenuLabel] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<SocialLink | null>(null);
  const [layout, setLayout] = useState<ViewLayout>("list");

  const usedLabels = useMemo(
    () => new Set(socials.map((social) => social.label)),
    [socials],
  );

  const availableLabels = useMemo(
    () =>
      SOCIAL_PLATFORM_OPTIONS.filter(
        (option) =>
          !usedLabels.has(option.label) || option.label === editingLabel,
      ),
    [usedLabels, editingLabel],
  );

  useEffect(() => {
    if (!modal && !openMenuLabel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenuLabel(null);
      if (!pending) closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, openMenuLabel, pending]);

  function openCreate() {
    if (!canManage) return;
    const first = availableLabels[0];
    if (!first) {
      toast.error("جميع المنصات مضافة مسبقاً");
      return;
    }
    setEditingLabel(null);
    setLabel(first.label);
    setLink("");
    setOpenMenuLabel(null);
    setModal("create");
  }

  function openEdit(social: SocialLink) {
    if (!canManage) return;
    setEditingLabel(social.label);
    setLabel(social.label as SocialLabel);
    setLink(social.link);
    setOpenMenuLabel(null);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditingLabel(null);
    setLink("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;

    startTransition(async () => {
      const result = await upsertSocialLink({ label, link });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(modal === "edit" ? "تم تحديث الرابط" : "تم إضافة الرابط");
      closeModal();
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!canManage || !deleting) return;

    startTransition(async () => {
      const result = await deleteSocialLink(deleting.label);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف الرابط");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-kufam text-2xl font-semibold text-foreground">
            روابط التواصل
          </h2>
          <p className="max-w-xl text-sm text-foreground/65">
            الروابط الظاهرة في تذييل الموقع. المنصات بدون رابط لا تُعرض.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <LayoutToggle value={layout} onChange={setLayout} />
          {canManage && (
            <Button
              onClick={openCreate}
              className="gap-2"
              disabled={availableLabels.length === 0}
            >
              <Plus className="size-4" />
              رابط جديد
            </Button>
          )}
        </div>
      </div>

      {socials.length > 0 ? (
        <ul
          className={
            layout === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {socials.map((social) => (
            <li
              key={social.label}
              className={`rounded-2xl border border-border/80 bg-background/70 p-4 ${
                openMenuLabel === social.label ? "z-50" : "z-0"
              } ${
                layout === "grid"
                  ? "relative flex flex-col gap-4"
                  : "relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              }`}
            >
              <div
                className={`flex min-w-0 items-center gap-3 ${
                  layout === "grid" ? "flex-col text-center" : ""
                }`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <SocialIcon
                    label={social.label}
                    title={getSocialDisplayName(social.label)}
                  />
                </div>
                <div
                  className={`min-w-0 space-y-1 ${
                    layout === "grid" ? "w-full" : ""
                  }`}
                >
                  <p className="font-kufam text-lg text-foreground">
                    {getSocialDisplayName(social.label)}
                  </p>
                  <Link
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-mono text-sm text-muted-foreground transition hover:text-primary hover:underline"
                    dir="ltr"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {social.link}
                  </Link>
                </div>
              </div>

              {canManage && (
                <div
                  className={
                    layout === "grid"
                      ? "absolute top-3 left-3 z-20"
                      : "relative shrink-0 self-end sm:self-center"
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuLabel(
                        openMenuLabel === social.label ? null : social.label,
                      )
                    }
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="خيارات"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                  {openMenuLabel === social.label && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenMenuLabel(null)}
                      />
                      <div className="absolute top-full left-0 z-50 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => openEdit(social)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
                        >
                          <Pencil className="size-3.5" />
                          تعديل
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            setOpenMenuLabel(null);
                            setDeleting(social);
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
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-kufam text-lg text-foreground">لا روابط بعد</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            أضف روابط منصات التواصل لتظهر في تذييل الموقع.
          </p>
          {canManage && (
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="size-4" />
              إضافة رابط
            </Button>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف الرابط"
        description={
          deleting
            ? `هل تريد حذف رابط «${getSocialDisplayName(deleting.label)}» من الموقع؟`
            : ""
        }
        confirmLabel="حذف"
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onConfirmDelete}
      />

      {canManage && modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!pending) closeModal();
            }}
            aria-hidden
          />
          <form
            onSubmit={onSubmit}
            className="relative z-10 w-full max-w-md animate-[fade-up_0.25s_ease-out] space-y-5 rounded-t-3xl border border-border bg-background p-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-kufam text-2xl font-semibold text-foreground">
                  {modal === "create" ? "رابط جديد" : "تعديل الرابط"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  اختر المنصة وأدخل الرابط الكامل.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={pending}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
                aria-label="إغلاق"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="social-label">المنصة</Label>
                <select
                  id="social-label"
                  value={label}
                  disabled={modal === "edit"}
                  onChange={(e) => setLabel(e.target.value as SocialLabel)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {(modal === "edit"
                    ? SOCIAL_PLATFORM_OPTIONS.filter((o) => o.label === label)
                    : availableLabels
                  ).map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-link">الرابط</Label>
                <Input
                  id="social-link"
                  dir="ltr"
                  type="url"
                  placeholder="https://"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
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
    </section>
  );
}
