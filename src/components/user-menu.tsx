"use client";

import { logout } from "@/app/actions";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function UserMenu({
  user,
}: {
  user: (SessionData["user"] & { isAdmin: boolean }) | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = user?.isAdmin ?? false;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex cursor-pointer items-center rounded-full transition-opacity hover:opacity-80 focus:outline-none"
      >
        <Image
          src={user?.image ?? ""}
          alt="User Avatar"
          width={40}
          height={40}
          className="rounded-full border-2 border-[#0E0E0E]"
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30 h-screen cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 z-40 mt-2 w-48 overflow-hidden rounded-md border border-border bg-background py-1 shadow-lg md:right-0 md:left-auto rtl:right-auto rtl:left-0">
            <Link
              href={`https://profile.intra.42.fr/users/${user?.login}`}
              target="_blank"
              className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsOpen(false)}
            >
              {`42/${user?.login}`}
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  لوحة التحكم
                </Link>
                <Link
                  href="/dashboard/calendar"
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  التقويم
                </Link>
                <Link
                  href="/dashboard/connections"
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  الاتصالات
                </Link>
                <Link
                  href="/dashboard/pool"
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  المسبح
                </Link>
                <Link
                  href="/dashboard/finance"
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  المالية
                </Link>
                <Link
                  href="/dashboard/members"
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  الأعضاء
                </Link>
              </>
            )}

            <hr className="my-1 border-border" />

            <button
              onClick={() => logout()}
              className="block w-full cursor-pointer px-4 py-2 text-start text-sm text-red-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
}
