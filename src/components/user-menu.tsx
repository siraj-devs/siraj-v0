"use client";

import { logout } from "@/app/actions";
import type { MemberRole } from "@/lib/members";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const OWNER_LINKS = [
  { href: "/dashboard", label: "لوحة التحكم" },
  { href: "/dashboard/calendar", label: "التقويم" },
  { href: "/dashboard/connections", label: "الاتصالات" },
  { href: "/dashboard/finance", label: "المالية" },
  { href: "/dashboard/members", label: "الأعضاء" },
] as const;

const ADMIN_LINKS = [
  { href: "/dashboard/members", label: "الأعضاء" },
  { href: "/dashboard/calendar", label: "التقويم" },
  { href: "/dashboard/finance", label: "المالية" },
] as const;

export function UserMenu({
  user,
}: {
  user: (SessionData["user"] & {
    isAdmin: boolean;
    role: MemberRole | null;
  }) | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = user?.isAdmin ?? false;
  const avatarSrc = user?.image || null;
  const links = user?.role === "owner" ? OWNER_LINKS : ADMIN_LINKS;

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
          <div className="absolute left-0 z-40 mt-2 w-48 overflow-hidden rounded-md border border-border bg-background py-1 shadow-lg md:right-0 md:left-auto rtl:right-auto rtl:left-0">
            <div className="border-b border-border px-4 py-2">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name ?? user?.login}
              </p>
              {user?.login && (
                <p className="truncate text-xs text-muted-foreground">
                  @{user.login}
                </p>
              )}
            </div>
            {isAdmin &&
              links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2 text-sm transition-colors hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

            <hr className="my-1 border-border" />

            <button
              onClick={() => logout()}
              className="block w-full cursor-pointer px-4 py-2 text-start text-sm text-red-500 transition-colors hover:bg-muted"
            >
              تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
}
