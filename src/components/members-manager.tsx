"use client";

import {
  createMember,
  deleteMember,
  updateMember,
  type DcConnectionOption,
  type FtConnectionOption,
  type GoogleConnectionOption,
  type MemberProfile,
} from "@/app/actions/members";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { KebabMenu, type KebabMenuItem } from "@/components/dashboard/kebab-menu";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import { SearchFilterBar, matchesSelection } from "@/components/dashboard/search-filter-bar";
import type { ViewLayout } from "@/components/layout-toggle";
import { DiscordIcon, FortyTwoIcon } from "@/components/member-brand-icons";
import {
  MemberFormDialog,
  emptyMemberForm as emptyForm,
  type MemberFormState,
} from "@/components/member-form-dialog";
import {
  MEMBER_ROLE_ICONS,
  MEMBER_ROLE_TONES,
  MemberRoleBadge,
} from "@/components/member-role-badge";
import { Button } from "@/components/ui/button";
import {
  MEMBER_ROLE_ORDER,
  isRoleVisibleTo,
  type MemberRole,
} from "@/lib/member-role";
import {
  GRANTABLE_DASHBOARD_PAGES,
  type DashboardPagePath,
} from "@/lib/page-permissions";
import {
  CalendarDays,
  Clapperboard,
  ClipboardList,
  Crown,
  FileText,
  GraduationCap,
  Handshake,
  Link2,
  ListChecks,
  Medal,
  Network,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { RemoteAvatar } from "@/components/remote-avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { PhoneIcon } from "@phosphor-icons/react";

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

const PAGE_ICONS: Record<DashboardPagePath, LucideIcon> = {
  "/dashboard/members": Users,
  "/dashboard/calendar": CalendarDays,
  "/dashboard/finance": Wallet,
  "/dashboard/meetings": Handshake,
  "/dashboard/submissions": ClipboardList,
  "/dashboard/connections": Link2,
  "/dashboard/content": FileText,
  "/dashboard/courses": GraduationCap,
  "/dashboard/sessions": Clapperboard,
  "/dashboard/network": Network,
  "/dashboard/lists": ListChecks,
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
  googleConnections,
  canManage,
  viewerRole,
  currentMemberId,
}: {
  members: MemberProfile[];
  ftConnections: FtConnectionOption[];
  dcConnections: DcConnectionOption[];
  googleConnections: GoogleConnectionOption[];
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
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        (m.phone?.includes(q) ?? false) ||
        (m.login?.toLowerCase().includes(q) ?? false) ||
        (m.dc_username?.toLowerCase().includes(q) ?? false) ||
        (m.google_email?.toLowerCase().includes(q) ?? false)
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

  const googleOptions =
    modal === "edit" && editingMember?.google_connection
      ? [
          ...googleConnections.filter(
            (c) => c.id !== editingMember.google_connection,
          ),
          ...(editingMember.google_connection
            ? [
                {
                  id: editingMember.google_connection,
                  email: editingMember.google_email,
                  name: editingMember.name,
                  avatar: editingMember.google_avatar,
                } satisfies GoogleConnectionOption,
              ]
            : []),
        ].sort((a, b) =>
          (a.email ?? a.id).localeCompare(b.email ?? b.id),
        )
      : googleConnections;

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
      first_name: member.first_name || member.name.split(/\s+/)[0] || "",
      last_name:
        member.last_name ||
        member.name.trim().split(/\s+/).slice(1).join(" ") ||
        "",
      phone: member.phone ?? "",
      role: member.role,
      ft_connection: member.ft_connection ? String(member.ft_connection) : "",
      dc_connection: member.dc_connection ?? "",
      google_connection: member.google_connection ?? "",
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
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone.trim() || null,
      role: form.role,
      ft_connection: form.ft_connection ? Number(form.ft_connection) : null,
      dc_connection: form.dc_connection || null,
      google_connection: form.google_connection || null,
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

  const visibleRoles = MEMBER_ROLE_ORDER.filter((role) =>
    isRoleVisibleTo(viewerRole, role),
  );
  const statsColsClass =
    visibleRoles.length >= 5
      ? "lg:grid-cols-6"
      : visibleRoles.length === 4
        ? "lg:grid-cols-5"
        : "lg:grid-cols-4";
  const isOwnerViewer = viewerRole === "owner";
  /** Non-owner editors can't change an owner/admin's role (the server keeps it). */
  const roleLocked =
    !isOwnerViewer &&
    modal === "edit" &&
    (editingMember?.role === "owner" || editingMember?.role === "admin");

  const roleOptions = visibleRoles.map((role) => {
    const Icon = MEMBER_ROLE_ICONS[role];
    return {
      key: role,
      label: ROLE_LABELS[role],
      tone: MEMBER_ROLE_TONES[role],
      icon: <Icon />,
    };
  });

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
          className={`relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 ${statsColsClass}`}
        >
          {(
            [
              ["all", "الإجمالي", counts.all, Users],
              ["owner", "مالك", counts.owner, Crown],
              ["admin", "مشرف", counts.admin, Shield],
              ["participant", "عضو", counts.participant, UserRound],
              ["veteran", "مخضرم", counts.veteran, Medal],
              ["newcomer", "وافد", counts.newcomer, Sparkles],
            ] as const
          )
            .filter(
              ([key]) => key === "all" || isRoleVisibleTo(viewerRole, key),
            )
            .map(([key, label, value, Icon]) => (
            <div
              key={key}
              className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3 text-start"
            >
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="size-3.5" />
                {label}
              </p>
              <p className="mt-1 font-kufam text-lg text-foreground">{value}</p>
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
                className={`flex ${
                  isGrid ? "items-center flex-col gap-1.5" : "flex-wrap gap-3"
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
                {member.google_email && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    {member.google_email}
                  </span>
                )}
                {member.phone && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs ${
                      member.phone_verified_at
                        ? "text-emerald-700"
                        : "text-amber-800"
                    }`}
                  >
                    <PhoneIcon className="size-3.5 shrink-0" />
                    {member.phone}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                        member.phone_verified_at
                          ? "bg-emerald-500/10 ring-emerald-500/25"
                          : "bg-amber-500/10 ring-amber-500/25"
                      }`}
                    >
                      {member.phone_verified_at ? "موثّق" : "غير موثّق"}
                    </span>
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
            const avatar = (
              <RemoteAvatar
                src={member.avatar}
                alt={member.name}
                className={`rounded-2xl object-cover ${
                  isGrid
                    ? `size-20 ring-4 ring-background ${styles.ring}`
                    : `size-14 ring-2 ring-background ${styles.ring}`
                }`}
                fallback={
                  <div
                    className={`flex items-center justify-center rounded-2xl bg-foreground font-kufam text-background ${
                      isGrid
                        ? `size-20 text-xl ring-4 ring-background ${styles.ring}`
                        : `size-14 text-base ring-2 ring-background ${styles.ring}`
                    }`}
                  >
                    {initials(member.name)}
                  </div>
                }
              />
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
                      : "relative flex items-start gap-3 p-4 sm:items-center sm:justify-between sm:gap-4 sm:px-5"
                  }
                >
                  <Link
                    href={`/dashboard/members/${member.id}`}
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
                        className={`flex min-w-0 items-center gap-2 font-kufam font-medium text-foreground ${
                          isGrid
                            ? "mb-3 justify-center text-center text-xl"
                            : "text-lg"
                        }`}
                      >
                        <span className="truncate">{member.name}</span>
                        <span className="shrink-0">
                          <MemberRoleBadge
                            role={member.role}
                            size="sm"
                            iconOnly
                          />
                        </span>
                      </h3>
                      <div
                        className={`flex flex-col ${
                          isGrid ? "mt-auto w-full items-center gap-1" : "gap-2"
                        }`}
                      >
                        {connections}
                        {permissions}
                      </div>
                    </div>
                  </Link>

                  {canManage && (
                    <div
                      className={
                        isGrid
                          ? "absolute top-3 left-3 z-20"
                          : "relative shrink-0"
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
                          menuPlacement="down"
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
        <MemberFormDialog
          mode={modal}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={onSubmit}
          pending={pending}
          ftOptions={ftOptions}
          dcOptions={dcOptions}
          googleOptions={googleOptions}
          visibleRoles={visibleRoles}
          canAssignPrivileged={isOwnerViewer}
          roleLocked={roleLocked}
          showPermissions={canManage && isOwnerViewer}
          pageIcons={PAGE_ICONS}
        />
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
