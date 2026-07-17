"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type FtConnectionRow = {
  id: number;
  login: string;
  name: string | null;
  avatar: string | null;
  access_at: string | null;
  authorized_at: string | null;
};

export type DcConnectionRow = {
  id: string;
  username: string;
  email: string | null;
  avatar: string | null;
  access_at: string | null;
  authorized_at: string | null;
};

type ProviderFilter = "all" | "42" | "discord";

type UnifiedConnection =
  | {
      key: string;
      provider: "42";
      title: string;
      subtitle: string;
      href: string | null;
      avatar: string | null;
      access_at: string | null;
      authorized_at: string | null;
    }
  | {
      key: string;
      provider: "discord";
      title: string;
      subtitle: string;
      href: null;
      avatar: string | null;
      access_at: string | null;
      authorized_at: string | null;
    };

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-MA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
}

function accessTime(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

export function ConnectionsManager({
  ftConnections,
  dcConnections,
}: {
  ftConnections: FtConnectionRow[];
  dcConnections: DcConnectionRow[];
}) {
  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");

  const mixed = useMemo(() => {
    const rows: UnifiedConnection[] = [
      ...ftConnections.map(
        (c): UnifiedConnection => ({
          key: `ft-${c.id}`,
          provider: "42",
          title: c.name ?? c.login,
          subtitle: `@${c.login}`,
          href: `https://profile.intra.42.fr/users/${c.login}`,
          avatar: c.avatar,
          access_at: c.access_at,
          authorized_at: c.authorized_at,
        }),
      ),
      ...dcConnections.map(
        (c): UnifiedConnection => ({
          key: `dc-${c.id}`,
          provider: "discord",
          title: c.username,
          subtitle: c.email ?? "بدون بريد",
          href: null,
          avatar: c.avatar,
          access_at: c.access_at,
          authorized_at: c.authorized_at,
        }),
      ),
    ];

    return rows.sort(
      (a, b) => accessTime(b.access_at) - accessTime(a.access_at),
    );
  }, [ftConnections, dcConnections]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mixed.filter((row) => {
      if (providerFilter !== "all" && row.provider !== providerFilter)
        return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.subtitle.toLowerCase().includes(q)
      );
    });
  }, [mixed, query, providerFilter]);

  const filters: { key: ProviderFilter; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "42", label: "42" },
    { key: "discord", label: "ديسكورد" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative space-y-3">
          <p className="text-sm text-primary">حسابات الدخول</p>
          <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            الاتصالات
          </h1>
          <p className="max-w-lg text-foreground/65">
            عرض كل من سجّل الدخول عبر 42 أو ديسكورد، مع آخر وصول وتاريخ التفويض.
          </p>
        </div>

        <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setProviderFilter("all")}
            className={`rounded-2xl border px-4 py-3 text-start transition-all ${
              providerFilter === "all"
                ? "border-primary/40 bg-background shadow-sm"
                : "border-transparent bg-background/50 hover:border-border"
            }`}
          >
            <p className="text-xs text-muted-foreground">الإجمالي</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {ftConnections.length + dcConnections.length}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setProviderFilter("42")}
            className={`rounded-2xl border px-4 py-3 text-start transition-all ${
              providerFilter === "42"
                ? "border-primary/40 bg-background shadow-sm"
                : "border-transparent bg-background/50 hover:border-border"
            }`}
          >
            <p className="text-xs text-muted-foreground">42</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {ftConnections.length}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setProviderFilter("discord")}
            className={`rounded-2xl border px-4 py-3 text-start transition-all ${
              providerFilter === "discord"
                ? "border-primary/40 bg-background shadow-sm"
                : "border-transparent bg-background/50 hover:border-border"
            }`}
          >
            <p className="text-xs text-muted-foreground">ديسكورد</p>
            <p className="mt-1 font-kufam text-2xl text-foreground">
              {dcConnections.length}
            </p>
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو المعرّف…"
            className="pr-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setProviderFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                providerFilter === f.key
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
        <ul className="space-y-3">
          {filtered.map((row) => {
            const avatar = row.avatar ? (
              <Image
                src={row.avatar}
                alt={row.title}
                width={48}
                height={48}
                className="size-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-xl bg-foreground font-kufam text-sm text-background">
                {initials(row.title)}
              </div>
            );

            return (
              <li
                key={row.key}
                className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {row.href ? (
                    <Link
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      {avatar}
                    </Link>
                  ) : (
                    <div className="shrink-0">{avatar}</div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-kufam text-lg text-foreground">
                        {row.title}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          row.provider === "42"
                            ? "bg-primary/15 text-[#7a5a08] ring-primary/25"
                            : "bg-sky-500/10 text-sky-800 ring-sky-500/20"
                        }`}
                      >
                        {row.provider === "42" ? "42" : "ديسكورد"}
                      </span>
                    </div>
                    {row.href ? (
                      <Link
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate font-mono text-xs text-muted-foreground transition hover:text-primary"
                      >
                        {row.subtitle}
                      </Link>
                    ) : (
                      <p className="truncate text-xs text-muted-foreground">
                        {row.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-start">
                  <div>
                    <dt className="text-muted-foreground">آخر وصول</dt>
                    <dd className="mt-0.5 text-foreground">
                      {formatDateTime(row.access_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">التفويض</dt>
                    <dd className="mt-0.5 text-foreground">
                      {formatDateTime(row.authorized_at)}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Search className="size-6" />
          </div>
          <p className="font-kufam text-lg text-foreground">لا نتائج</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {ftConnections.length + dcConnections.length === 0
              ? "لا توجد اتصالات بعد. ستظهر هنا بعد أول تسجيل دخول."
              : "جرّب تغيير البحث أو فلتر المزود."}
          </p>
        </div>
      )}
    </div>
  );
}
