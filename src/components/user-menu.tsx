"use client";

import { logout } from "@/app/actions";
import {
  MEMBER_ROLE_LABELS,
  type MemberRole,
} from "@/lib/member-role";
import type { PageGrant } from "@/lib/page-permissions";
import {
  CalendarClock,
  CalendarDays,
  Clapperboard,
  ClipboardList,
  FileText,
  GraduationCap,
  Handshake,
  Link2,
  ListChecks,
  LogOut,
  type LucideIcon,
  Network,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { RemoteAvatar } from "@/components/remote-avatar";
import Link from "next/link";
import { useMemo, useState } from "react";

const DASHBOARD_LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
  viewerDefault?: boolean;
}[] = [
  { href: "/dashboard/members", label: "الأعضاء", icon: Users, viewerDefault: true },
  {
    href: "/dashboard/calendar",
    label: "التقويم",
    icon: CalendarDays,
    viewerDefault: true,
  },
  {
    href: "/dashboard/finance",
    label: "المالية",
    icon: Wallet,
    viewerDefault: true,
  },
  {
    href: "/dashboard/meetings",
    label: "اللقاءات",
    icon: Handshake,
    viewerDefault: true,
  },
  { href: "/dashboard/submissions", label: "التقديمات", icon: ClipboardList },
  { href: "/dashboard/connections", label: "الاتصالات", icon: Link2 },
  { href: "/dashboard/content", label: "المحتوى", icon: FileText },
  { href: "/dashboard/courses", label: "الدورات", icon: GraduationCap },
  { href: "/dashboard/sessions", label: "الأمسيات", icon: Clapperboard },
  { href: "/dashboard/network", label: "الشبكة", icon: Network },
  { href: "/dashboard/events", label: "الأحداث", icon: CalendarClock },
  { href: "/dashboard/lists", label: "اللوائح", icon: ListChecks },
];

export function UserMenu({
  user,
}: {
  user:
    | (SessionData["user"] & {
        isAdmin: boolean;
        role: MemberRole | null;
        pagePermissions: PageGrant[];
      })
    | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const avatarSrc = user?.image || null;
  const isOwner = user?.role === "owner";
  const hasViewerRole =
    user?.role === "owner" ||
    user?.role === "admin" ||
    user?.role === "participant";
  const permissions = user?.pagePermissions ?? [];

  const dashboardLinks = useMemo(() => {
    return DASHBOARD_LINKS.filter((link) => {
      if (isOwner) return true;
      if (link.viewerDefault && hasViewerRole) return true;
      return permissions.some((grant) => grant.path === link.href);
    });
  }, [isOwner, hasViewerRole, permissions]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-border transition-opacity hover:opacity-80 focus:outline-none"
        aria-label="قائمة المستخدم"
        aria-expanded={isOpen}
      >
        <RemoteAvatar
          src={avatarSrc}
          alt=""
          className="size-full object-cover"
          fallback={
            <span className="flex size-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
              {(user?.name ?? user?.login ?? "?").charAt(0)}
            </span>
          }
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30 h-screen cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 z-40 mt-2 w-52 overflow-hidden rounded-md border border-border bg-background shadow-lg md:right-0 md:left-auto rtl:right-auto rtl:left-0">
            <div className="border-b border-border px-4 py-2">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name ?? user?.login}
              </p>
              {user?.login && (
                <p className="truncate text-xs text-muted-foreground">
                  @{user.login}
                </p>
              )}
              {user?.role && (
                <p className="mt-1 text-xs text-primary">
                  {MEMBER_ROLE_LABELS[user.role]}
                </p>
              )}
            </div>
            <Link
              href="/portal/learning"
              className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
              تعلّمي
            </Link>
            {dashboardLinks.length > 0 && (
              <>
                <hr className="border-border" />
                {dashboardLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-muted"
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon className="size-4 shrink-0 text-muted-foreground" />
                    {link.label}
                  </Link>
                ))}
              </>
            )}
            <hr className="border-border" />

            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <UserRound className="size-4 shrink-0 text-muted-foreground" />
              الملف الشخصي
            </Link>
            <button
              onClick={() => logout()}
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-start text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut className="size-4 shrink-0" />
              تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
}
