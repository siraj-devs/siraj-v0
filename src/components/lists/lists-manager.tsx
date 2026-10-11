"use client";

import {
  createClubList,
  deleteClubList,
  updateClubList,
  type ClubList,
} from "@/app/actions/lists";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

export function ListsManager({
  lists,
  canManage,
}: {
  lists: ClubList[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ClubList | null>(null);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<ClubList | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setModal("create");
  }

  function openEdit(list: ClubList) {
    setEditing(list);
    setName(list.name);
    setModal("edit");
  }

  function closeModal() {
    if (pending) return;
    setModal(null);
    setEditing(null);
    setName("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      if (modal === "edit" && editing) {
        const result = await updateClubList(editing.id, name);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("تم تعديل اسم اللائحة");
        setModal(null);
        setEditing(null);
        setName("");
        router.refresh();
        return;
      }

      const result = await createClubList(name);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم إنشاء اللائحة");
      setModal(null);
      setName("");
      router.push(`/dashboard/lists/${result.id}`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteClubList(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف اللائحة");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <DashboardHeader
        eyebrow="إدارة المجتمع"
        title="اللوائح"
        description="أنشئ لائحة ثم أضف إليها حسابات 42."
        action={
          canManage ? (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              لائحة جديدة
            </Button>
          ) : undefined
        }
        stats={[
          { key: "all", label: "اللوائح", value: lists.length },
          {
            key: "people",
            label: "الحسابات",
            value: lists.reduce((sum, list) => sum + list.entry_count, 0),
          },
        ]}
        statsClassName="grid-cols-1 sm:grid-cols-2"
      />

      {lists.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <li
              key={list.id}
              className="relative rounded-2xl border border-border/80 bg-background/70 p-5 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]"
            >
              <Link href={`/dashboard/lists/${list.id}`} className="block">
                <h2 className="font-kufam text-xl text-foreground">{list.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {list.entry_count} حساب
                </p>
              </Link>
              {canManage && (
                <div className="absolute top-3 left-3 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="تعديل الاسم"
                    onClick={() => openEdit(list)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="حذف اللائحة"
                    onClick={() => setDeleting(list)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          لا توجد لوائح بعد.
        </p>
      )}

      {modal && (
        <FormDialog
          title={modal === "edit" ? "تعديل اللائحة" : "لائحة جديدة"}
          description={
            modal === "edit"
              ? "غيّر الاسم الظاهر لهذه اللائحة."
              : "اختر اسماً يظهر في قائمة اللوائح."
          }
          onClose={closeModal}
          onSubmit={onSubmit}
          pending={pending}
          submitLabel={modal === "edit" ? "حفظ" : "إنشاء"}
        >
          <div className="space-y-2">
            <Label htmlFor="list-name">الاسم</Label>
            <Input
              id="list-name"
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="اسم اللائحة"
            />
          </div>
        </FormDialog>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف اللائحة"
        description={
          deleting ? `هل تريد حذف لائحة «${deleting.name}»؟` : ""
        }
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onDelete}
      />
    </div>
  );
}
