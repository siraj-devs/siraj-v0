"use client";

import {
  addMeetingGuest,
  addMeetingMember,
  createMeeting,
  deleteMeeting,
  removeMeetingAttendee,
  updateMeeting,
  type ClubMeeting,
  type MeetingFtOption,
  type MeetingMemberOption,
} from "@/app/actions/meetings";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type MeetingFormState = {
  name: string;
  date: string;
  description: string;
  start_time: string;
  end_time: string;
};

type GuestFormState = {
  name: string;
  ft_connection: string;
};

function todayInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const emptyMeetingForm = (): MeetingFormState => ({
  name: "",
  date: todayInputValue(),
  description: "",
  start_time: "10:00",
  end_time: "11:00",
});

const emptyGuestForm = (): GuestFormState => ({
  name: "",
  ft_connection: "",
});

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("ar-MA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export function MeetingsManager({
  meetings,
  members,
  ftConnections,
  canManage,
}: {
  meetings: ClubMeeting[];
  members: MeetingMemberOption[];
  ftConnections: MeetingFtOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | "attendees" | null>(
    null,
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MeetingFormState>(emptyMeetingForm);
  const [guestForm, setGuestForm] = useState<GuestFormState>(emptyGuestForm);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [attendeeTab, setAttendeeTab] = useState<"member" | "guest">("member");
  const [deleting, setDeleting] = useState<ClubMeeting | null>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meetings;
    return meetings.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false),
    );
  }, [meetings, query]);

  const activeMeeting =
    meetings.find((m) => m.id === editingId) ?? null;

  const availableMembers = useMemo(() => {
    if (!activeMeeting) return members;
    const taken = new Set(
      activeMeeting.attendees
        .filter((a) => a.member_id != null)
        .map((a) => a.member_id as number),
    );
    return members.filter((m) => !taken.has(m.id));
  }, [members, activeMeeting]);

  function openCreate() {
    if (!canManage) return;
    setForm(emptyMeetingForm());
    setEditingId(null);
    setModal("create");
    setOpenMenuId(null);
  }

  function openEdit(meeting: ClubMeeting) {
    if (!canManage) return;
    setForm({
      name: meeting.name,
      date: meeting.date,
      description: meeting.description ?? "",
      start_time: meeting.start_time,
      end_time: meeting.end_time,
    });
    setEditingId(meeting.id);
    setModal("edit");
    setOpenMenuId(null);
  }

  function openAttendees(meeting: ClubMeeting) {
    setEditingId(meeting.id);
    setGuestForm(emptyGuestForm());
    setSelectedMemberId("");
    setAttendeeTab("member");
    setModal("attendees");
    setOpenMenuId(null);
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setForm(emptyMeetingForm());
    setGuestForm(emptyGuestForm());
    setSelectedMemberId("");
  }

  function onSubmitMeeting(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;

    const payload = {
      name: form.name,
      date: form.date,
      description: form.description || null,
      start_time: form.start_time,
      end_time: form.end_time,
    };

    startTransition(async () => {
      const result =
        modal === "edit" && editingId
          ? await updateMeeting({ id: editingId, ...payload })
          : await createMeeting(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(modal === "edit" ? "تم تحديث اللقاء" : "تم إنشاء اللقاء");
      closeModal();
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!canManage || !deleting) return;
    startTransition(async () => {
      const result = await deleteMeeting(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف اللقاء");
      setDeleting(null);
      router.refresh();
    });
  }

  function onAddMember(event: FormEvent) {
    event.preventDefault();
    if (!canManage || !editingId || !selectedMemberId) return;

    startTransition(async () => {
      const result = await addMeetingMember({
        meeting_id: editingId,
        member_id: Number(selectedMemberId),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تمت إضافة العضو");
      setSelectedMemberId("");
      router.refresh();
    });
  }

  function onAddGuest(event: FormEvent) {
    event.preventDefault();
    if (!canManage || !editingId) return;

    startTransition(async () => {
      const result = await addMeetingGuest({
        meeting_id: editingId,
        name: guestForm.name,
        ft_connection: guestForm.ft_connection
          ? Number(guestForm.ft_connection)
          : null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تمت إضافة الضيف");
      setGuestForm(emptyGuestForm());
      router.refresh();
    });
  }

  function onRemoveAttendee(id: number) {
    if (!canManage) return;
    startTransition(async () => {
      const result = await removeMeetingAttendee(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تمت الإزالة");
      router.refresh();
    });
  }

  const MAX_ATTENDEES = 7;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-primary">تنظيم النادي</p>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              اللقاءات
            </h1>
            <p className="max-w-lg text-foreground/65">
              أنشئ اللقاءات، حدّد الوقت، وسجّل حضور الأعضاء والضيوف.
            </p>
          </div>

          {canManage && (
            <Button
              onClick={openCreate}
              className="shrink-0 gap-2 self-start md:self-auto"
            >
              <Plus className="size-4" />
              لقاء جديد
            </Button>
          )}
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-primary/40 bg-background px-4 py-3 shadow-sm">
            <p className="text-xs text-muted-foreground">الإجمالي</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {meetings.length}
            </p>
          </div>
          <div className="rounded-2xl border border-transparent bg-background/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">الحضور الكلي</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {meetings.reduce((sum, m) => sum + m.attendees.length, 0)}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-transparent bg-background/50 px-4 py-3 sm:col-span-1">
            <p className="text-xs text-muted-foreground">الضيوف</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {meetings.reduce(
                (sum, m) =>
                  sum + m.attendees.filter((a) => a.kind === "guest").length,
                0,
              )}
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
          {filtered.map((meeting) => (
            <li
              key={meeting.id}
              className="relative rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] sm:px-5 sm:py-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-kufam text-xl text-foreground">
                      {meeting.name}
                    </h3>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {meeting.attendees.length} حضور
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(meeting.date)} · {formatTime(meeting.start_time)}{" "}
                    – {formatTime(meeting.end_time)}
                  </p>
                  {meeting.description ? (
                    <p className="text-sm text-foreground/70">
                      {meeting.description}
                    </p>
                  ) : null}
                </div>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === meeting.id ? null : meeting.id,
                      )
                    }
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="خيارات اللقاء"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>

                  {openMenuId === meeting.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute top-9 left-0 z-20 w-40 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => openAttendees(meeting)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <Users className="size-3.5" />
                          الحضور
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(meeting)}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                            >
                              <Pencil className="size-3.5" />
                              تعديل
                            </button>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleting(meeting);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                            >
                              <Trash2 className="size-3.5" />
                              حذف
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {meeting.attendees.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
                  {meeting.attendees.slice(0, MAX_ATTENDEES).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs"
                      title={a.kind === "guest" ? "ضيف" : "عضو"}
                    >
                      {a.avatar ? (
                        <Image
                          src={a.avatar}
                          alt=""
                          width={20}
                          height={20}
                          className="size-5 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px]">
                          {a.name.charAt(0)}
                        </span>
                      )}
                      <span className="max-w-24 truncate">{a.name}</span>
                    </div>
                  ))}
                  {meeting.attendees.length > MAX_ATTENDEES && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      +{meeting.attendees.length - MAX_ATTENDEES}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Search className="size-6" />
          </div>
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {meetings.length === 0
              ? "لم يُنشأ أي لقاء بعد. ابدأ بإضافة أول لقاء للنادي."
              : "جرّب تغيير نص البحث."}
          </p>
          {canManage && meetings.length === 0 && (
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="size-4" />
              إضافة لقاء
            </Button>
          )}
        </div>
      )}

      {canManage && (modal === "create" || modal === "edit") && (
        <FormDialog
          title={modal === "create" ? "لقاء جديد" : "تعديل اللقاء"}
          description="حدّد الاسم والتاريخ ووقت البداية والنهاية."
          onClose={closeModal}
          onSubmit={onSubmitMeeting}
          pending={pending}
          submitLabel="حفظ"
        >
          <div className="space-y-2">
            <Label htmlFor="meeting-name">الاسم</Label>
            <Input
              id="meeting-name"
              required
              autoFocus
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="مثال: اجتماع الفريق الأسبوعي"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-date">التاريخ</Label>
            <Input
              id="meeting-date"
              type="date"
              required
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="meeting-start">البداية</Label>
              <Input
                id="meeting-start"
                type="time"
                required
                value={form.start_time}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-end">النهاية</Label>
              <Input
                id="meeting-end"
                type="time"
                required
                value={form.end_time}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, end_time: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-desc">الوصف (اختياري)</Label>
            <Input
              id="meeting-desc"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="موضوع اللقاء أو ملاحظات…"
            />
          </div>
        </FormDialog>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف اللقاء"
        description={
          deleting ? `هل تريد حذف لقاء «${deleting.name}»؟` : ""
        }
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onConfirmDelete}
      />

      {modal === "attendees" && activeMeeting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={closeModal} aria-hidden />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-border p-6 sm:p-8 sm:pb-5">
              <div>
                <h2 className="font-kufam text-2xl font-semibold text-foreground">
                  حضور اللقاء
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeMeeting.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="إغلاق"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto p-6 sm:p-8 sm:pt-5">
              {canManage && (
                <>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAttendeeTab("member")}
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        attendeeTab === "member"
                          ? "border-primary/50 bg-primary/10 font-medium text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      عضو
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendeeTab("guest")}
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        attendeeTab === "guest"
                          ? "border-primary/50 bg-primary/10 font-medium text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      ضيف
                    </button>
                  </div>

                  {attendeeTab === "member" ? (
                    <form onSubmit={onAddMember} className="space-y-3">
                      <Label htmlFor="add-member">إضافة عضو</Label>
                      <div className="flex gap-2">
                        <select
                          id="add-member"
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <option value="">اختر عضواً…</option>
                          {availableMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                              {m.login ? ` (@${m.login})` : ""}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="submit"
                          disabled={pending || !selectedMemberId}
                          className="shrink-0 gap-1"
                        >
                          <UserPlus className="size-4" />
                          إضافة
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={onAddGuest} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="guest-name">اسم الضيف</Label>
                        <Input
                          id="guest-name"
                          required
                          value={guestForm.name}
                          onChange={(e) =>
                            setGuestForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="اسم الضيف"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest-ft">حساب 42 (اختياري)</Label>
                        <select
                          id="guest-ft"
                          value={guestForm.ft_connection}
                          onChange={(e) =>
                            setGuestForm((prev) => ({
                              ...prev,
                              ft_connection: e.target.value,
                            }))
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <option value="">بدون ربط</option>
                          {ftConnections.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.login}
                              {c.name ? ` — ${c.name}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="submit"
                        disabled={pending}
                        className="w-full gap-2"
                      >
                        <UserPlus className="size-4" />
                        إضافة ضيف
                      </Button>
                    </form>
                  )}
                </>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  قائمة الحضور ({activeMeeting.attendees.length})
                </p>
                {activeMeeting.attendees.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    لا يوجد حضور بعد.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {activeMeeting.attendees.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {a.avatar ? (
                            <Image
                              src={a.avatar}
                              alt=""
                              width={36}
                              height={36}
                              className="size-9 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-sm">
                              {a.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {a.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {a.kind === "member" ? "عضو" : "ضيف"}
                              {a.login ? (
                                <>
                                  {" · "}
                                  <Link
                                    href={`https://profile.intra.42.fr/users/${a.login}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary"
                                  >
                                    @{a.login}
                                  </Link>
                                </>
                              ) : null}
                            </p>
                          </div>
                        </div>
                        {canManage && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => onRemoveAttendee(a.id)}
                            className="rounded-lg p-1.5 text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                            aria-label="إزالة"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
