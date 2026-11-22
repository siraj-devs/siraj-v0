"use client";

import {
  addListEntryNote,
  deleteListEntryNote,
  updateListEntryNote,
  updateListEntryPriority,
  type ListEntry,
  type ListEntryNote,
} from "@/app/actions/lists";
import {
  LIST_ENTRY_PRIORITIES,
  LIST_ENTRY_PRIORITY_LABELS,
  type ListEntryPriority,
} from "@/lib/list-entry";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import {
  StatusBadge,
  type BadgeTone,
} from "@/components/dashboard/status-badge";
import { RemoteAvatar } from "@/components/remote-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { campusLabelAr } from "@/lib/network-labels";
import { cn } from "@/lib/utils";
import {
  SealIcon,
  StarFourIcon,
  StarIcon,
  type Icon,
} from "@phosphor-icons/react";
import {
  Calendar,
  Flag,
  MapPin,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

const PRIORITY_TONE: Record<Exclude<ListEntryPriority, "none">, BadgeTone> = {
  high: "rose",
  medium: "amber",
  low: "sky",
};

const PRIORITY_ICON: Record<Exclude<ListEntryPriority, "none">, Icon> = {
  high: SealIcon,
  medium: StarIcon,
  low: StarFourIcon,
};

const PRIORITY_STYLES: Record<ListEntryPriority, string> = {
  none: "border-border bg-muted/40 text-muted-foreground",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-900",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-950",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-900",
};

function formatNoteTime(iso: string) {
  return new Date(iso).toLocaleString("ar-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PriorityBadge({
  priority,
  size = "md",
}: {
  priority: ListEntryPriority;
  size?: "sm" | "md";
}) {
  if (priority === "none") return null;
  const Icon = PRIORITY_ICON[priority];
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  return (
    <StatusBadge
      tone={PRIORITY_TONE[priority]}
      icon={<Icon className={iconSize} weight="fill" />}
      label={LIST_ENTRY_PRIORITY_LABELS[priority]}
      size={size}
      iconOnly
    />
  );
}

export function NotesCountChip({
  count,
  size = "md",
}: {
  count: number;
  size?: "sm" | "md";
}) {
  if (count <= 0) return null;
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  return (
    <StatusBadge
      tone="slate"
      icon={<MessageSquare className={iconSize} />}
      label={`${count} ملاحظة`}
      size={size}
    />
  );
}

export function ListEntryPanel({
  listId,
  entry,
  canManage,
  currentMemberId,
  mode,
  onClose,
}: {
  listId: string;
  entry: ListEntry;
  canManage: boolean;
  currentMemberId: number | null;
  mode: "notes" | "priority";
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [priority, setPriority] = useState<ListEntryPriority>(entry.priority);
  const [noteBody, setNoteBody] = useState("");
  const [editingNote, setEditingNote] = useState<ListEntryNote | null>(null);
  const [editBody, setEditBody] = useState("");
  const [deletingNote, setDeletingNote] = useState<ListEntryNote | null>(null);

  useEffect(() => {
    setPriority(entry.priority);
    setNoteBody("");
    setEditingNote(null);
    setEditBody("");
    setDeletingNote(null);
  }, [entry]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, pending]);

  function onPriorityChange(next: ListEntryPriority) {
    if (!canManage || next === priority) return;
    const previous = priority;
    setPriority(next);
    startTransition(async () => {
      const result = await updateListEntryPriority({
        listId,
        entryId: entry.id,
        priority: next,
      });
      if (!result.success) {
        setPriority(previous);
        toast.error(result.error);
        return;
      }
      toast.success("تم تحديث الأولوية");
      router.refresh();
    });
  }

  function onAddNote(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    const body = noteBody.trim();
    if (!body) return;
    startTransition(async () => {
      const result = await addListEntryNote({
        listId,
        entryId: entry.id,
        body,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setNoteBody("");
      toast.success("تمت إضافة الملاحظة");
      router.refresh();
    });
  }

  function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingNote) return;
    const body = editBody.trim();
    if (!body) return;
    startTransition(async () => {
      const result = await updateListEntryNote({
        listId,
        noteId: editingNote.id,
        body,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setEditingNote(null);
      setEditBody("");
      toast.success("تم تعديل الملاحظة");
      router.refresh();
    });
  }

  function onConfirmDeleteNote() {
    if (!deletingNote) return;
    startTransition(async () => {
      const result = await deleteListEntryNote({
        listId,
        noteId: deletingNote.id,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDeletingNote(null);
      toast.success("تم حذف الملاحظة");
      router.refresh();
    });
  }

  const campus = campusLabelAr(entry.campus);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
        <div
          className="absolute inset-0"
          onClick={() => !pending && onClose()}
          aria-hidden
        />
        <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg animate-[fade-up_0.25s_ease-out] flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              <RemoteAvatar
                src={entry.avatar}
                alt={entry.name}
                className="size-14 shrink-0 rounded-2xl object-cover"
                fallback={
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-foreground font-kufam text-background">
                    {entry.name.slice(0, 1)}
                  </div>
                }
              />
              <div className="min-w-0 space-y-1">
                <h2 className="truncate font-kufam text-xl font-semibold text-foreground">
                  {entry.name}
                </h2>
                <Link
                  href={`https://profile.intra.42.fr/users/${encodeURIComponent(entry.login)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="text-sm text-muted-foreground underline-offset-2 transition hover:text-primary hover:underline"
                >
                  @{entry.login}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {campus && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {campus}
                    </span>
                  )}
                  {entry.pool_year != null && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {entry.pool_year}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label="إغلاق"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
            {mode === "priority" ? (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flag className="size-4 text-primary" />
                  <h3 className="font-kufam text-base text-foreground">
                    الأولوية
                  </h3>
                </div>
                {canManage ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {LIST_ENTRY_PRIORITIES.map((value) => {
                      const selected = priority === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={pending}
                          aria-pressed={selected}
                          onClick={() => onPriorityChange(value)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm transition",
                            selected
                              ? PRIORITY_STYLES[value]
                              : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                          )}
                        >
                          {LIST_ENTRY_PRIORITY_LABELS[value]}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {priority === "none"
                      ? "بدون أولوية"
                      : LIST_ENTRY_PRIORITY_LABELS[priority]}
                  </p>
                )}
              </section>
            ) : (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquarePlus className="size-4 text-primary" />
                    <h3 className="font-kufam text-base text-foreground">
                      الملاحظات
                    </h3>
                  </div>
                  <NotesCountChip count={entry.notes.length} size="sm" />
                </div>

                {entry.notes.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    لا ملاحظات بعد على هذا الحساب.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {entry.notes.map((note) => {
                      const isMine = currentMemberId === note.member_id;
                      const canEditNote = canManage && isMine;
                      const canDeleteNote = canManage;
                      const isEditing = editingNote?.id === note.id;

                      return (
                        <li
                          key={note.id}
                          className="rounded-2xl border border-border/70 bg-muted/20 p-3"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <RemoteAvatar
                                src={note.member_avatar}
                                alt={note.member_name}
                                className="size-8 shrink-0 rounded-xl object-cover"
                                fallback={
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-kufam text-xs text-primary">
                                    {note.member_name.slice(0, 1)}
                                  </div>
                                }
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {note.member_name}
                                  {isMine ? (
                                    <span className="ms-1 text-[11px] font-normal text-primary">
                                      أنت
                                    </span>
                                  ) : null}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatNoteTime(note.created_at)}
                                  {note.updated_at !== note.created_at
                                    ? " · معدّلة"
                                    : ""}
                                </p>
                              </div>
                            </div>
                            {(canEditNote || canDeleteNote) && !isEditing && (
                              <div className="flex shrink-0 items-center gap-1">
                                {canEditNote && (
                                  <button
                                    type="button"
                                    aria-label="تعديل الملاحظة"
                                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
                                    onClick={() => {
                                      setEditingNote(note);
                                      setEditBody(note.body);
                                    }}
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                )}
                                {canDeleteNote && (
                                  <button
                                    type="button"
                                    aria-label="حذف الملاحظة"
                                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setDeletingNote(note)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <form onSubmit={onSaveEdit} className="space-y-2">
                              <Textarea
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                rows={3}
                                required
                                disabled={pending}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={pending}
                                  onClick={() => {
                                    setEditingNote(null);
                                    setEditBody("");
                                  }}
                                >
                                  إلغاء
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={pending}
                                >
                                  {pending ? "جاري الحفظ…" : "حفظ"}
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                              {note.body}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {canManage && (
                  <form
                    onSubmit={onAddNote}
                    className="space-y-2 border-t border-border/60 pt-4"
                  >
                    <Textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder="أضف ملاحظة عن هذا الحساب…"
                      rows={3}
                      required
                      disabled={pending}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        className="gap-1.5"
                        disabled={pending || !noteBody.trim()}
                      >
                        <MessageSquarePlus className="size-3.5" />
                        {pending ? "جاري الإضافة…" : "إضافة ملاحظة"}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        open={Boolean(deletingNote)}
        title="حذف الملاحظة"
        description="هل تريد حذف هذه الملاحظة؟"
        pending={pending}
        onCancel={() => {
          if (!pending) setDeletingNote(null);
        }}
        onConfirm={onConfirmDeleteNote}
      />
    </>
  );
}
