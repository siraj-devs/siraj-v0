"use client";

import type {
  DcConnectionOption,
  FtConnectionOption,
  GoogleConnectionOption,
} from "@/app/actions/members";
import { BADGE_TONE_CLASSES } from "@/components/dashboard/status-badge";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { FormSection } from "@/components/dashboard/form-section";
import {
  MEMBER_ROLE_ICONS,
  MEMBER_ROLE_TONES,
} from "@/components/member-role-badge";
import { DiscordIcon, FortyTwoIcon, GoogleIcon } from "@/components/member-brand-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEMBER_ROLE_LABELS, type MemberRole } from "@/lib/member-role";
import {
  GRANTABLE_DASHBOARD_PAGES,
  type DashboardPagePath,
  type PageAccessLevel,
  type PageGrant,
} from "@/lib/page-permissions";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  KeyRound,
  Link2,
  Lock,
  Phone,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";

export type MemberFormState = {
  first_name: string;
  last_name: string;
  phone: string;
  role: MemberRole;
  ft_connection: string;
  dc_connection: string;
  google_connection: string;
  page_permissions: PageGrant[];
};

export const emptyMemberForm: MemberFormState = {
  first_name: "",
  last_name: "",
  phone: "",
  role: "newcomer",
  ft_connection: "",
  dc_connection: "",
  google_connection: "",
  page_permissions: [],
};

const ROLE_PICKER_ORDER: MemberRole[] = [
  "newcomer",
  "veteran",
  "participant",
  "admin",
  "owner",
];

const ROLE_HINTS: Record<MemberRole, string> = {
  newcomer: "منضم حديثاً",
  veteran: "خبرة سابقة",
  participant: "عضو في الفريق",
  admin: "يدير لوحة التحكم",
  owner: "كامل الصلاحيات",
};

const PAGE_ACCESS_OPTIONS: { value: PageAccessLevel | "none"; label: string }[] =
  [
    { value: "none", label: "بدون" },
    { value: "view", label: "مشاهدة" },
    { value: "edit", label: "تعديل" },
  ];

function ConnectionSelect({
  id,
  label,
  icon,
  iconClassName,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  iconClassName: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const linked = value !== "";
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center justify-between gap-2">
        {label}
        {linked && (
          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-700">
            <Check className="size-3" />
            مرتبط
          </span>
        )}
      </Label>
      <div className="relative">
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 start-1.5 my-auto flex size-7 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex h-10 w-full appearance-none rounded-xl border bg-background/80 ps-11 pe-9 text-sm shadow-xs transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            linked ? "border-input text-foreground" : "border-input text-muted-foreground",
          )}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

export function MemberFormDialog({
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  pending,
  ftOptions,
  dcOptions,
  googleOptions,
  visibleRoles,
  canAssignPrivileged,
  roleLocked,
  showPermissions,
  pageIcons,
}: {
  mode: "create" | "edit";
  form: MemberFormState;
  setForm: Dispatch<SetStateAction<MemberFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  pending: boolean;
  ftOptions: FtConnectionOption[];
  dcOptions: DcConnectionOption[];
  googleOptions: GoogleConnectionOption[];
  /** Roles the viewer is allowed to see. */
  visibleRoles: readonly MemberRole[];
  /** Only the owner can grant owner/admin. */
  canAssignPrivileged: boolean;
  /** Editing an owner/admin as a non-owner: role is read-only. */
  roleLocked: boolean;
  showPermissions: boolean;
  pageIcons: Record<DashboardPagePath, LucideIcon>;
}) {
  const roles = ROLE_PICKER_ORDER.filter((role) => visibleRoles.includes(role));
  const grantedCount = form.page_permissions.length;
  const linkedCount = [
    form.ft_connection,
    form.dc_connection,
    form.google_connection,
  ].filter(Boolean).length;

  return (
    <FormDialog
      title={mode === "create" ? "إضافة عضو" : "تعديل عضو"}
      description="البيانات الأساسية، الدور، والحسابات المرتبطة."
      onClose={onClose}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel="حفظ"
      maxWidthClassName="max-w-2xl"
    >
      <FormSection
        icon={<UserRound />}
        title="البيانات الأساسية"
        hint="الاسم بالعربية ورقم الهاتف."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="member-first-name">الاسم الأول</Label>
            <span className="font-medium text-red-500 mr-1 text-sm">*</span>
            <Input
              id="member-first-name"
              required
              autoFocus
              value={form.first_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, first_name: e.target.value }))
              }
              placeholder="مثال: أحمد"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-last-name">اسم العائلة</Label>
            <span className="font-medium text-red-500 mr-1 text-sm">*</span>
            <Input
              id="member-last-name"
              required
              value={form.last_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, last_name: e.target.value }))
              }
              placeholder="مثال: العلوي"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-phone">
             رقم الهاتف
            <span className="text-xs font-normal text-muted-foreground">
              {" (اختياري) "}
            </span>
          </Label>
          <div className="relative" dir="ltr">
            <Phone className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-muted-foreground" />
            <Input
              id="member-phone"
              type="tel"
              className="pe-9 text-left"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="06XXXXXXXX"
            />
          </div>
          {mode === "edit" && (
            <p className="text-xs text-muted-foreground">
              تغيير الرقم يلغي توثيقه حتى يتحقق منه العضو مجدداً.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        icon={<ShieldCheck />}
        title="الدور"
        hint={
          roleLocked
            ? "دور المالك والمشرف يغيّره المالك فقط."
            : "يحدد ما يظهر للعضو في لوحة التحكم."
        }
      >
        <div
          role="radiogroup"
          aria-label="الدور"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {roles.map((role) => {
            const Icon = MEMBER_ROLE_ICONS[role];
            const selected = form.role === role;
            const privileged = role === "owner" || role === "admin";
            const disabled =
              roleLocked || (privileged && !canAssignPrivileged);
            return (
              <button
                key={role}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled && !selected}
                onClick={() => {
                  if (disabled) return;
                  setForm((prev) => ({ ...prev, role }));
                }}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-all",
                  selected
                    ? "border-primary/50 bg-primary/8 shadow-[0_6px_20px_-14px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
                    : "border-border/80 bg-background/70 hover:border-primary/30 hover:bg-background",
                  disabled && !selected && "cursor-not-allowed opacity-45 hover:border-border/80 hover:bg-background/70",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                    BADGE_TONE_CLASSES[MEMBER_ROLE_TONES[role]],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {MEMBER_ROLE_LABELS[role]}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {ROLE_HINTS[role]}
                  </span>
                </span>
                {selected &&
                  (roleLocked ? (
                    <Lock className="absolute top-2 end-2 size-3 text-muted-foreground" />
                  ) : (
                    <Check className="absolute top-2 end-2 size-3.5 text-primary" />
                  ))}
              </button>
            );
          })}
        </div>
      </FormSection>

      <FormSection
        icon={<Link2 />}
        title="الحسابات المرتبطة"
        hint="الحسابات التي يسجّل بها العضو الدخول."
        aside={
          <span className="rounded-full bg-background px-2.5 py-0.5 text-xs text-muted-foreground ring-1 ring-inset ring-border/70">
            {linkedCount}/3
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ConnectionSelect
            id="member-ft"
            label="حساب 42"
            icon={<FortyTwoIcon className="size-3.5" />}
            iconClassName="bg-foreground text-background"
            value={form.ft_connection}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, ft_connection: value }))
            }
          >
            <option value="">بدون ربط</option>
            {ftOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.login}
                {c.name ? ` — ${c.name}` : ""}
              </option>
            ))}
          </ConnectionSelect>

          <ConnectionSelect
            id="member-dc"
            label="حساب ديسكورد"
            icon={<DiscordIcon className="size-3.5" />}
            iconClassName="bg-[#5865F2]/15 text-[#5865F2]"
            value={form.dc_connection}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, dc_connection: value }))
            }
          >
            <option value="">بدون ربط</option>
            {dcOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.username}
                {c.email ? ` — ${c.email}` : ""}
              </option>
            ))}
          </ConnectionSelect>

          <div className="sm:col-span-2">
            <ConnectionSelect
              id="member-google"
              label="حساب Google"
              icon={<GoogleIcon className="size-3.5" />}
              iconClassName="bg-muted"
              value={form.google_connection}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, google_connection: value }))
              }
            >
              <option value="">بدون ربط</option>
              {googleOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.email ?? c.id}
                  {c.name ? ` — ${c.name}` : ""}
                </option>
              ))}
            </ConnectionSelect>
          </div>
        </div>
      </FormSection>

      {showPermissions && (
        <FormSection
          icon={<KeyRound />}
          title="صلاحيات الصفحات"
          hint="لكل صفحة: مشاهدة فقط، أو مشاهدة وتعديل."
          aside={
            <span className="rounded-full bg-background px-2.5 py-0.5 text-xs text-muted-foreground ring-1 ring-inset ring-border/70">
              {grantedCount}
            </span>
          }
        >
          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-background/70">
            {GRANTABLE_DASHBOARD_PAGES.map((page) => {
              const access =
                form.page_permissions.find((item) => item.path === page.path)
                  ?.access ?? "none";
              const Icon = pageIcons[page.path];
              return (
                <li
                  key={page.path}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span
                    className={cn(
                      "inline-flex min-w-0 items-center gap-2 text-sm",
                      access === "none"
                        ? "text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg",
                        access === "edit"
                          ? "bg-primary/12 text-foreground"
                          : access === "view"
                            ? "bg-muted text-foreground"
                            : "bg-muted/50 text-muted-foreground",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="truncate">{page.label}</span>
                  </span>
                  <div className="flex shrink-0 rounded-lg bg-muted p-0.5">
                    {PAGE_ACCESS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={access === option.value}
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
                                    { path: page.path, access: option.value },
                                  ],
                          }))
                        }
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs transition",
                          access === option.value
                            ? "bg-background font-medium text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </FormSection>
      )}
    </FormDialog>
  );
}
