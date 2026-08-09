"use client";

import { logout } from "@/app/actions";
import {
  MEMBER_ROLE_LABELS,
  type MemberRole,
} from "@/lib/member-role";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Handshake,
  Link2,
  LogOut,
  type LucideIcon,
  UserRound,
  UserRoundCheck,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const OWNER_LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard/submissions", label: "التقديمات", icon: ClipboardList },
  { href: "/dashboard/connections", label: "الاتصالات", icon: Link2 },
  { href: "/dashboard/content", label: "المحتوى", icon: FileText },
  { href: "/dashboard/courses", label: "الدورات", icon: GraduationCap },
  {
    href: "/dashboard/profile-requests",
    label: "طلبات الملف",
    icon: UserRoundCheck,
  },
];

const VIEWER_LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard/members", label: "الأعضاء", icon: Users },
  { href: "/dashboard/calendar", label: "التقويم", icon: CalendarDays },
  { href: "/dashboard/finance", label: "المالية", icon: Wallet },
  { href: "/dashboard/meetings", label: "اللقاءات", icon: Handshake },
];

export function UserMenu({
  user,
}: {
  user:
    | (SessionData["user"] & {
        isAdmin: boolean;
        role: MemberRole | null;
      })
    | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = user?.isAdmin ?? false;
  const avatarSrc = user?.image || null;
  const isOwner = user?.role === "owner";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-border transition-opacity hover:opacity-80 focus:outline-none"
        aria-label="قائمة المستخدم"
        aria-expanded={isOpen}
      >
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt=""
            width={40}
            height={40}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
            {(user?.name ?? user?.login ?? "?").charAt(0)}
          </span>
        )}
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
            {isAdmin && (
              <>
                {VIEWER_LINKS.map((link) => (
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
                <hr className="border-border" />
              </>
            )}
            {isOwner && (
              <>
                {OWNER_LINKS.map((link) => (
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
                <hr className="border-border" />
              </>
            )}

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
