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
import { KebabMenu, type KebabMenuItem } from "@/components/dashboard/kebab-menu";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import { SearchFilterBar, matchesSelection } from "@/components/dashboard/search-filter-bar";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemberRole } from "@/lib/members";
import {
  GRANTABLE_DASHBOARD_PAGES,
  type DashboardPagePath,
  type PageAccessLevel,
  type PageGrant,
} from "@/lib/page-permissions";
import {
  CalendarClock,
  Clapperboard,
  ClipboardList,
  Crown,
  FileText,
  GraduationCap,
  Link2,
  Medal,
  Network,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
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
  page_permissions: PageGrant[];
};

const PAGE_ACCESS_OPTIONS: { value: PageAccessLevel | "none"; label: string }[] =
  [
    { value: "none", label: "بدون" },
    { value: "view", label: "مشاهدة" },
    { value: "edit", label: "تعديل" },
  ];

const PAGE_ICONS: Record<DashboardPagePath, LucideIcon> = {
  "/dashboard/submissions": ClipboardList,
  "/dashboard/connections": Link2,
  "/dashboard/content": FileText,
  "/dashboard/courses": GraduationCap,
  "/dashboard/profile-requests": UserRoundCheck,
  "/dashboard/sessions": Clapperboard,
  "/dashboard/network": Network,
  "/dashboard/events": CalendarClock,
};

function FortyTwoIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.581 16.851H24v-4.439ZM24 3.574h-4.419v4.42l-4.419 4.418v4.44h4.419v-4.44L24 7.993Zm-4.419 0h-4.419v4.42zm-6.324 8.838H4.419l8.838-8.838H8.838L0 12.412v3.595h8.838v4.419h4.419z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

const emptyForm: MemberFormState = {
  name: "",
  role: "newcomer",
  ft_connection: "",
  dc_connection: "",
  page_permissions: [],
};

type RoleFilter = MemberRole;

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
  viewerRole,
  currentMemberId,
}: {
  members: MemberProfile[];
  ftConnections: FtConnectionOption[];
  dcConnections: DcConnectionOption[];
  canManage: boolean;
  viewerRole: MemberRole | null;
  currentMemberId: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MemberFormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter[]>([]);
  const [layout, setLayout] = useState<ViewLayout>("grid");
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
      if (!matchesSelection(roleFilter, m.role)) return false;
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
      page_permissions: member.page_permissions ?? [],
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
      page_permissions: form.page_permissions,
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

  const hidePrivilegedRoles = viewerRole !== "owner";

  const roleOptions = (
    [
      { key: "owner" as const, label: "مالك", tone: "rose" as const, icon: <Crown /> },
      { key: "admin" as const, label: "مشرف", tone: "amber" as const, icon: <Shield /> },
      { key: "participant" as const, label: "عضو", tone: "emerald" as const, icon: <UserRound /> },
      { key: "veteran" as const, label: "مخضرم", tone: "sky" as const, icon: <Medal /> },
      { key: "newcomer" as const, label: "وافد", tone: "violet" as const, icon: <Sparkles /> },
    ]
  ).filter(
    (option) =>
      !hidePrivilegedRoles ||
      (option.key !== "owner" && option.key !== "admin"),
  );

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

        <div
          className={`relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 ${
            hidePrivilegedRoles ? "lg:grid-cols-4" : "lg:grid-cols-6"
          }`}
        >
          {(
            [
              ["all", "الإجمالي", counts.all],
              ["owner", "مالك", counts.owner],
              ["admin", "مشرف", counts.admin],
              ["participant", "عضو", counts.participant],
              ["veteran", "مخضرم", counts.veteran],
              ["newcomer", "وافد", counts.newcomer],
            ] as const
          )
            .filter(
              ([key]) =>
                !hidePrivilegedRoles || (key !== "owner" && key !== "admin"),
            )
            .map(([key, label, value]) => (
            <div
              key={key}
              className="rounded-2xl border border-transparent bg-background/50 px-4 py-3 text-start"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-kufam text-2xl text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="ابحث بالاسم أو 42 أو ديسكورد…"
        menuTitle="تصفية الأعضاء"
        onReset={() => setRoleFilter([])}
        layout={layout}
        onLayoutChange={setLayout}
        groups={[
          {
            title: "الدور",
            selected: roleFilter,
            onChange: (next) => setRoleFilter(next as RoleFilter[]),
            options: roleOptions,
          },
        ]}
      />

      {filtered.length > 0 ? (
        <div
          className={
            layout === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-3"
          }
        >
          {filtered.map((member) => {
            const styles = ROLE_STYLES[member.role];
            const isGrid = layout === "grid";
            const menuItems: KebabMenuItem[] = [
              {
                key: "edit",
                label: "تعديل",
                icon: <Pencil className="size-3.5" />,
                onClick: () => openEdit(member),
              },
              {
                key: "delete",
                label: "حذف",
                icon: <Trash2 className="size-3.5" />,
                variant: "destructive",
                disabled: member.id === currentMemberId || pending,
                onClick: () => setDeleting(member),
              },
            ];
            const grants = GRANTABLE_DASHBOARD_PAGES.flatMap((page) => {
              const grant = member.page_permissions.find(
                (item) => item.path === page.path,
              );
              return grant ? [{ page, grant }] : [];
            });
            const connections = (
              <div
                className={`flex flex-col gap-1 ${
                  isGrid ? "items-center" : ""
                }`}
              >
                {member.login && (
                  <Link
                    href={`https://profile.intra.42.fr/users/${member.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition hover:text-primary"
                  >
                    <FortyTwoIcon className="size-3.5 shrink-0" />
                    {member.login}
                  </Link>
                )}
                {member.dc_username && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <DiscordIcon className="size-3.5 shrink-0 text-[#5865F2]" />
                    {member.dc_username}
                  </span>
                )}
              </div>
            );
            const permissions = canManage && grants.length > 0 && (
              <div
                className={`flex flex-wrap gap-1.5 ${
                  isGrid ? "justify-center mt-2" : "mt-1"
                }`}
              >
                {grants.map(({ page, grant }) => {
                  const Icon = PAGE_ICONS[page.path];
                  return (
                    <span
                      key={page.path}
                      title={`${page.label} (${grant.access === "edit" ? "تعديل" : "مشاهدة"})`}
                      className={`inline-flex size-6 items-center justify-center rounded-lg ring-1 ring-inset ${
                        grant.access === "edit"
                          ? "bg-primary/12 text-foreground ring-primary/25"
                          : "bg-muted text-muted-foreground ring-border"
                      }`}
                    >
                      <Icon className="size-3" />
                    </span>
                  );
                })}
              </div>
            );
            const avatar = member.avatar ? (
              <Image
                src={member.avatar}
                alt={member.name}
                width={isGrid ? 80 : 56}
                height={isGrid ? 80 : 56}
                className={`rounded-2xl object-cover ${
                  isGrid
                    ? `size-20 ring-4 ring-background ${styles.ring}`
                    : `size-14 ring-2 ring-background ${styles.ring}`
                }`}
              />
            ) : (
              <div
                className={`flex items-center justify-center rounded-2xl bg-foreground font-kufam text-background ${
                  isGrid
                    ? `size-20 text-xl ring-4 ring-background ${styles.ring}`
                    : `size-14 text-base ring-2 ring-background ${styles.ring}`
                }`}
              >
                {initials(member.name)}
              </div>
            );

            return (
              <article
                key={member.id}
                className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-background/70 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] ${
                  isGrid ? "flex flex-col" : ""
                }`}
              >
                {isGrid && (
                  <div
                    className={`h-16 bg-linear-to-l ${styles.accent}`}
                    aria-hidden
                  />
                )}

                <div
                  className={
                    isGrid
                      ? "relative flex flex-1 flex-col items-center px-5 pt-0 pb-6"
                      : "relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  }
                >
                  <div
                    className={
                      isGrid
                        ? "flex flex-col items-center"
                        : "flex min-w-0 flex-1 items-center gap-4"
                    }
                  >
                    <div className={isGrid ? "-mt-10 mb-4" : "shrink-0"}>
                      {avatar}
                    </div>
                    <div
                      className={`min-w-0 ${
                        isGrid ? "flex flex-col items-center" : "space-y-2"
                      }`}
                    >
                      <h3
                        className={`font-kufam font-medium text-foreground ${
                          isGrid
                            ? "mb-2 text-center text-xl"
                            : "truncate text-lg space-x-2"
                        }`}
                      >
                        <span>{member.name}</span> 
                        {!isGrid && (
                          <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${styles.badge} ${
                            isGrid ? "mb-4" : ""
                          }`}
                        >
                          {ROLE_LABELS[member.role]}
                        </span>
                        )}
                      </h3>
                      {isGrid && (
                        <span
                        className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${styles.badge}`}
                      >
                        {ROLE_LABELS[member.role]}
                      </span>
                      )}
                      <div
                        className={`flex flex-col gap-2 ${
                          isGrid ? "mt-auto w-full items-center" : ""
                        }`}
                      >
                        {connections}
                        {permissions}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div
                      className={
                        isGrid
                          ? "absolute top-3 left-3 z-20"
                          : "relative shrink-0 self-end sm:self-center"
                      }
                    >
                      {isGrid ? (
                        <KebabMenu
                          items={menuItems}
                          open={openMenuId === member.id}
                          onToggle={() =>
                            setOpenMenuId(
                              openMenuId === member.id ? null : member.id,
                            )
                          }
                          onClose={() => setOpenMenuId(null)}
                          placement="down"
                          ariaLabel="خيارات العضو"
                          buttonClassName="rounded-lg bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
                        />
                      ) : (
                        <ListRowActions
                          items={menuItems}
                          open={openMenuId === member.id}
                          onToggle={() =>
                            setOpenMenuId(
                              openMenuId === member.id ? null : member.id,
                            )
                          }
                          onClose={() => setOpenMenuId(null)}
                          menuPlacement="up"
                          ariaLabel="خيارات العضو"
                        />
                      )}
                    </div>
                  )}
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

          {canManage && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium leading-none">
                صلاحيات الصفحات
              </legend>
              <p className="text-xs text-muted-foreground">
                لكل صفحة: مشاهدة فقط، أو مشاهدة وتعديل.
              </p>
              <div className="space-y-2">
                {GRANTABLE_DASHBOARD_PAGES.map((page) => {
                  const access =
                    form.page_permissions.find((item) => item.path === page.path)
                      ?.access ?? "none";
                  return (
                    <div
                      key={page.path}
                      className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="inline-flex items-center gap-2 text-sm text-foreground">
                        {(() => {
                          const Icon = PAGE_ICONS[page.path];
                          return <Icon className="size-4 shrink-0" />;
                        })()}
                        {page.label}
                      </span>
                      <div className="flex rounded-lg bg-muted p-0.5">
                        {PAGE_ACCESS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                page_permissions:
                                  option.value === "none"
                                    ? prev.page_permissions.filter(
                                        (item) => item.path !== page.path,
                                      )
                                    : [
                                        ...prev.page_permissions.filter(
                                          (item) => item.path !== page.path,
                                        ),
                                        {
                                          path: page.path,
                                          access: option.value,
                                        },
                                      ],
                              }))
                            }
                            className={`rounded-md px-2.5 py-1 text-xs transition ${
                              access === option.value
                                ? "bg-background font-medium text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}
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
