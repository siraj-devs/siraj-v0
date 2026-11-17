"use client";

import {
  createEvent,
  deleteEvent,
  updateEvent,
  type ClubEvent,
} from "@/app/actions/events";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { ALL_WEEKDAYS } from "@/lib/event-repeat";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  emptyEventForm,
  EventFormDialog,
  type EventFormState,
} from "./event-form-dialog";

/** Convert ISO → value for `<input type="datetime-local">` (local wall time). */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local datetime-local string → ISO for the server. */
function fromDatetimeLocalValue(local: string): string {
  return new Date(local).toISOString();
}

/** Create / edit / delete flow for calendar events. Render `dialogs` once. */
export function useEventEditor({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ClubEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyEventForm);

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setForm(emptyEventForm());
  }

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, pending]);

  /** `dateKey` (`YYYY-MM-DD`) prefills a single-day 09:00–10:00 event. */
  function openCreate(dateKey?: string) {
    if (!canManage) return;
    setForm(
      dateKey
        ? {
            ...emptyEventForm(),
            start_at: `${dateKey}T09:00`,
            end_at: `${dateKey}T10:00`,
            repeat_mode: "none",
          }
        : emptyEventForm(),
    );
    setEditingId(null);
    setModal("create");
  }

  function openEdit(event: ClubEvent) {
    if (!canManage) return;
    setForm({
      name: event.name,
      start_at: toDatetimeLocalValue(event.start_at),
      end_at: toDatetimeLocalValue(event.end_at),
      color: event.color,
      repeat_mode: event.repeat_mode,
      repeat_weekdays:
        event.repeat_mode === "weekly" && event.repeat_weekdays.length > 0
          ? event.repeat_weekdays
          : [...ALL_WEEKDAYS],
    });
    setEditingId(event.id);
    setModal("edit");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;

    startTransition(async () => {
      const payload = {
        name: form.name,
        start_at: fromDatetimeLocalValue(form.start_at),
        end_at: fromDatetimeLocalValue(form.end_at),
        color: form.color,
        repeat_mode: form.repeat_mode,
        repeat_weekdays: form.repeat_weekdays,
      };

      if (modal === "edit" && editingId) {
        const result = await updateEvent({ id: editingId, ...payload });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("تم تحديث الحدث");
      } else {
        const result = await createEvent(payload);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("تم إنشاء الحدث");
      }
      closeModal();
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!canManage || !deleting) return;
    startTransition(async () => {
      const result = await deleteEvent(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف الحدث");
      setDeleting(null);
      router.refresh();
    });
  }

  const dialogs: ReactNode = (
    <>
      {modal && (
        <EventFormDialog
          mode={modal}
          form={form}
          onFormChange={setForm}
          pending={pending}
          onClose={closeModal}
          onSubmit={onSubmit}
        />
      )}
      <ConfirmDeleteModal
        open={!!deleting}
        title="حذف الحدث"
        description={
          deleting
            ? `هل تريد حذف «${deleting.name}»؟ سيختفي من الجدول أيضاً.`
            : ""
        }
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onConfirmDelete}
      />
    </>
  );

  return {
    pending,
    openCreate,
    openEdit,
    askDelete: (event: ClubEvent) => {
      if (canManage) setDeleting(event);
    },
    dialogs,
  };
}
