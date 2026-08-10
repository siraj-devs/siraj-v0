"use client";

import {
  createMember,
  deleteMember,
  updateMember,
  type DcConnectionOption,
  type FtConnectionOption,
  type MemberProfile,
} from "@/app/actions/members";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemberRole } from "@/lib/members";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "مالك",
  admin: "مشرف",
  participant: "عضو",
  veteran: "مخضرم",
  newcomer: "وافد",
};

const ROLE_STYLES: Record<
  MemberRole,
  { badge: string; accent: string; ring: string }
> = {
  owner: {
    badge: "bg-rose-500/10 text-rose-800 ring-rose-500/20",
    accent: "from-rose-500/15 to-transparent",
    ring: "ring-rose-400/40",
  },
  admin: {
    badge: "bg-primary/15 text-[#7a5a08] ring-primary/25",
    accent: "from-primary/20 to-transparent",
    ring: "ring-primary/45",
  },
  participant: {
    badge: "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20",
    accent: "from-emerald-500/12 to-transparent",
    ring: "ring-emerald-400/35",
  },
  veteran: {
    badge: "bg-sky-500/10 text-sky-800 ring-sky-500/20",
    accent: "from-sky-500/15 to-transparent",
    ring: "ring-sky-400/40",
  },
  newcomer: {
    badge: "bg-violet-500/10 text-violet-800 ring-violet-500/20",
    accent: "from-violet-500/12 to-transparent",
    ring: "ring-violet-400/35",
  },
};

type MemberFormState = {
  name: string;
  role: MemberRole;
  ft_connection: string;
  dc_connection: string;
};

const emptyForm: MemberFormState = {
  name: "",
  role: "newcomer",
  ft_connection: "",
  dc_connection: "",
};

type RoleFilter = "all" | MemberRole;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
}

export function MembersManager({
  members,
  ftConnections,
  dcConnections,
  canManage,
  currentMemberId,
}: {
  members: MemberProfile[];
  ftConnections: FtConnectionOption[];
  dcConnections: DcConnectionOption[];
  canManage: boolean;
  currentMemberId: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MemberFormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [deleting, setDeleting] = useState<MemberProfile | null>(null);

  useEffect(() => {
    if (!openMenuId && !modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenuId(null);
      setModal(null);
      setEditingId(null);
      setForm(emptyForm);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openMenuId, modal]);

  const counts = useMemo(() => {
    return members.reduce(
      (acc, m) => {
        acc.all += 1;
        acc[m.role] += 1;
        return acc;
      },
      {
        all: 0,
        owner: 0,
        admin: 0,
        participant: 0,
        veteran: 0,
        newcomer: 0,
      },
    );
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.login?.toLowerCase().includes(q) ?? false) ||
        (m.dc_username?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [members, query, roleFilter]);

  const editingMember = members.find((m) => m.id === editingId) ?? null;

  const ftOptions =
    modal === "edit" && editingMember?.ft_connection
      ? [
          ...ftConnections.filter((c) => c.id !== editingMember.ft_connection),
          ...(editingMember.login
            ? [
                {
                  id: editingMember.ft_connection,
                  login: editingMember.login,
                  name: editingMember.name,
                  avatar: editingMember.avatar,
                } satisfies FtConnectionOption,
              ]
            : []),
        ].sort((a, b) => a.login.localeCompare(b.login))
      : ftConnections;

  const dcOptions =
    modal === "edit" && editingMember?.dc_connection
      ? [
          ...dcConnections.filter((c) => c.id !== editingMember.dc_connection),
          ...(editingMember.dc_username
            ? [
                {
                  id: editingMember.dc_connection,
                  username: editingMember.dc_username,
                  email: null,
                  avatar: editingMember.dc_avatar,
                } satisfies DcConnectionOption,
              ]
            : []),
        ].sort((a, b) => a.username.localeCompare(b.username))
      : dcConnections;

  function openCreate() {
    if (!canManage) return;
    setForm(emptyForm);
    setEditingId(null);
    setModal("create");
    setOpenMenuId(null);
  }

  function openEdit(member: MemberProfile) {
    if (!canManage) return;
    setForm({
      name: member.name,
      role: member.role,
      ft_connection: member.ft_connection ? String(member.ft_connection) : "",
      dc_connection: member.dc_connection ?? "",
    });
    setEditingId(member.id);
    setModal("edit");
    setOpenMenuId(null);
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setForm(emptyForm);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;

    const payload = {
      name: form.name,
      role: form.role,
      ft_connection: form.ft_connection ? Number(form.ft_connection) : null,
      dc_connection: form.dc_connection || null,
    };

    startTransition(async () => {
      const result =
        modal === "edit" && editingId
          ? await updateMember({ id: editingId, ...payload })
          : await createMember(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(modal === "edit" ? "تم تحديث العضو" : "تم إضافة العضو");
      closeModal();
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!canManage || !deleting) return;
    startTransition(async () => {
      const result = await deleteMember(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف العضو");
      setDeleting(null);
      router.refresh();
    });
  }

  const filters: { key: RoleFilter; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "owner", label: "مالك" },
    { key: "admin", label: "مشرف" },
    { key: "participant", label: "عضو" },
    { key: "veteran", label: "مخضرم" },
    { key: "newcomer", label: "وافد" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-primary">إدارة الفريق</p>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              الأعضاء
            </h1>
            <p className="max-w-lg text-foreground/65">
              عرض أعضاء نادي سراج، أدوارهم، وربط حسابات 42 و ديسكورد.
            </p>
          </div>

          {canManage && (
            <Button
              onClick={openCreate}
              className="shrink-0 gap-2 self-start md:self-auto"
            >
              <Plus className="size-4" />
              عضو جديد
            </Button>
          )}
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["all", "الإجمالي", counts.all],
              ["owner", "مالك", counts.owner],
              ["admin", "مشرف", counts.admin],
              ["participant", "عضو", counts.participant],
              ["veteran", "مخضرم", counts.veteran],
              ["newcomer", "وافد", counts.newcomer],
            ] as const
          ).map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRoleFilter(key)}
              className={`rounded-2xl border px-4 py-3 text-start transition-all ${
                roleFilter === key
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
            placeholder="ابحث بالاسم أو 42 أو ديسكورد…"
            className="pr-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setRoleFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                roleFilter === f.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground/70 hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((member) => {
            const styles = ROLE_STYLES[member.role];
            return (
              <article
                key={member.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/70 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)]"
              >
                <div
                  className={`h-16 bg-linear-to-l ${styles.accent}`}
                  aria-hidden
                />

                <div className="relative flex flex-1 flex-col items-center px-5 pt-0 pb-6">
                  <div className="-mt-10 mb-4">
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        width={80}
                        height={80}
                        className={`size-20 rounded-2xl object-cover ring-4 ring-background ${styles.ring}`}
                      />
                    ) : (
                      <div
                        className={`flex size-20 items-center justify-center rounded-2xl bg-foreground font-kufam text-xl text-background ring-4 ring-background ${styles.ring}`}
                      >
                        {initials(member.name)}
                      </div>
                    )}
                  </div>

                  {canManage && (
                    <div className="absolute top-3 left-3">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === member.id ? null : member.id,
                          )
                        }
                        className="rounded-lg bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
                        aria-label="خيارات العضو"
                      >
                        <MoreHorizontal className="size-5" />
                      </button>

                      {openMenuId === member.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute top-9 left-0 z-20 w-36 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => openEdit(member)}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                            >
                              <Pencil className="size-3.5" />
                              تعديل
                            </button>
                            <button
                              type="button"
                              disabled={
                                member.id === currentMemberId || pending
                              }
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleting(member);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                            >
                              <Trash2 className="size-3.5" />
                              حذف
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <h3 className="mb-2 text-center font-kufam text-xl font-medium text-foreground">
                    {member.name}
                  </h3>

                  <span
                    className={`mb-4 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${styles.badge}`}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>

                  <div className="mt-auto flex flex-col items-center gap-1">
                    {member.login ? (
                      <Link
                        href={`https://profile.intra.42.fr/users/${member.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-muted-foreground transition hover:text-primary"
                      >
                        42/@{member.login}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">
                        بدون 42
                      </span>
                    )}
                    {member.dc_username ? (
                      <span className="font-mono text-xs text-muted-foreground">
                        ديسكورد/@{member.dc_username}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">
                        بدون ديسكورد
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Search className="size-6" />
          </div>
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {members.length === 0
              ? "لم يُضف أي عضو بعد. ابدأ بإضافة أول عضو للنادي."
              : "جرّب تغيير البحث أو فلتر الدور."}
          </p>
          {canManage && members.length === 0 && (
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="size-4" />
              إضافة عضو
            </Button>
          )}
        </div>
      )}

      {modal && (
        <FormDialog
          title={modal === "create" ? "إضافة عضو" : "تعديل عضو"}
          description="حدّد الاسم والدور واربط حساب 42 و/أو ديسكورد."
          onClose={closeModal}
          onSubmit={onSubmit}
          pending={pending}
          submitLabel="حفظ"
        >
          <div className="space-y-2">
            <Label htmlFor="member-name">الاسم</Label>
            <Input
              id="member-name"
              required
              autoFocus
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="اسم العضو"
            />
          </div>

          <div className="space-y-2">
            <Label>الدور</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {(
                [
                  "newcomer",
                  "participant",
                  "veteran",
                  "admin",
                  "owner",
                ] as MemberRole[]
              ).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role }))}
                  className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    form.role === role
                      ? "border-primary/50 bg-primary/10 font-medium text-foreground"
                      : "border-border text-muted-foreground hover:border-border hover:bg-muted/50"
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-ft">حساب 42</Label>
            <select
              id="member-ft"
              value={form.ft_connection}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  ft_connection: e.target.value,
                }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value="">بدون ربط</option>
              {ftOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.login}
                  {c.name ? ` — ${c.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-dc">حساب ديسكورد</Label>
            <select
              id="member-dc"
              value={form.dc_connection}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  dc_connection: e.target.value,
                }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value="">بدون ربط</option>
              {dcOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.username}
                  {c.email ? ` — ${c.email}` : ""}
                </option>
              ))}
            </select>
          </div>
        </FormDialog>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف العضو"
        description={
          deleting ? `هل تريد حذف «${deleting.name}» من النادي؟` : ""
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
