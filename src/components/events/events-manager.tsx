"use client";

import {
  createEvent,
  deleteEvent,
  updateEvent,
  type ClubEvent,
} from "@/app/actions/events";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ALL_WEEKDAYS } from "@/lib/event-repeat";
import {
  emptyEventForm,
  EventFormDialog,
  type EventFormState,
} from "./event-form-dialog";
import { EventsList } from "./events-list";

/** Convert ISO → value for `<input type="datetime-local">` (local wall time). */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local datetime-local string → ISO for the server. */
function fromDatetimeLocalValue(local: string): string {
  const d = new Date(local);
  return d.toISOString();
}

export function EventsManager({
  events,
  canManage,
}: {
  events: ClubEvent[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [deleting, setDeleting] = useState<ClubEvent | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyEventForm);
  const [layout, setLayout] = useState<ViewLayout>("grid");

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

  const counts = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let past = 0;
    for (const e of events) {
      if (new Date(e.end_at).getTime() >= now) upcoming += 1;
      else past += 1;
    }
    return { all: events.length, upcoming, past };
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => e.name.toLowerCase().includes(q));
  }, [events, query]);

  function openCreate() {
    if (!canManage) return;
    setForm(emptyEventForm());
    setEditingId(null);
    setModal("create");
    setOpenMenuId(null);
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
    setOpenMenuId(null);
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setForm(emptyEventForm());
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
        closeModal();
        router.refresh();
        return;
      }

      const result = await createEvent(payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم إنشاء الحدث");
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <DashboardHeader
        eyebrow="إدارة المجتمع"
        title="الأحداث"
        description="أنشئ الأحداث بلون مخصص لتظهر في تقويم النادي."
        action={
          canManage && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              حدث جديد
            </Button>
          )
        }
        stats={[
          { key: "all", label: "الإجمالي", value: counts.all },
          { key: "upcoming", label: "قادمة", value: counts.upcoming },
          { key: "past", label: "منتهية", value: counts.past },
        ]}
        statsClassName="grid-cols-1 sm:grid-cols-3"
      />

      <DashboardToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="ابحث باسم الحدث…"
        filters={[]}
        activeFilter="all"
        onFilterChange={() => {}}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <EventsList
        events={filtered}
        allEventsCount={events.length}
        layout={layout}
        canManage={canManage}
        openMenuId={openMenuId}
        onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
        onCloseMenu={() => setOpenMenuId(null)}
        onEdit={openEdit}
        onDelete={setDeleting}
        onCreate={openCreate}
      />

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
            ? `هل تريد حذف «${deleting.name}»؟ سيختفي من التقويم أيضاً.`
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
