"use client";

import {
  addListProfile,
  lookupListProfile,
  removeListEntry,
  type ClubList,
  type ListEntry,
  type ListProfileCard,
} from "@/app/actions/lists";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { ProfileResultModal } from "@/components/lists/profile-result-modal";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { KebabMenu, type KebabMenuItem } from "@/components/dashboard/kebab-menu";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import { matchesSelection } from "@/components/dashboard/search-filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ViewLayout } from "@/components/layout-toggle";
import { campusLabelAr } from "@/lib/network-labels";
import { Calendar, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

function EntryAvatar({
  entry,
  className,
}: {
  entry: ListEntry;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const size = className ?? "size-14";
  if (entry.avatar && !failed) {
    return (
      <img
        src={entry.avatar}
        alt={entry.name}
        className={`${size} shrink-0 rounded-2xl object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-2xl bg-foreground font-kufam text-background`}
    >
      {entry.name.slice(0, 1)}
    </div>
  );
}

function EntryMeta({
  entry,
  className,
}: {
  entry: ListEntry;
  className?: string;
}) {
  const campus = campusLabelAr(entry.campus);
  const year = entry.pool_year;
  if (!campus && year == null) return null;

  return (
    <div
      className={
        className ??
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
      }
    >
      {campus && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{campus}</span>
        </span>
      )}
      {year != null && (
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3 shrink-0" />
          <span>{year}</span>
        </span>
      )}
    </div>
  );
}

export function ListDetail({
  list,
  entries,
  canManage,
}: {
  list: ClubList;
  entries: ListEntry[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [login, setLogin] = useState("");
  const [result, setResult] = useState<{
    status: "added" | "already" | "confirm";
    profile: ListProfileCard;
  } | null>(null);
  const [removing, setRemoving] = useState<ListEntry | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const [campuses, setCampuses] = useState<string[]>([]);
  const [layout, setLayout] = useState<ViewLayout>("grid");

  const yearOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      values.add(entry.pool_year != null ? String(entry.pool_year) : "unknown");
    }
    return [...values].sort((a, b) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return Number(b) - Number(a);
    });
  }, [entries]);

  const campusOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      values.add(campusLabelAr(entry.campus) ?? "unknown");
    }
    return [...values].sort((a, b) => a.localeCompare(b, "ar"));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const yearKey = entry.pool_year != null ? String(entry.pool_year) : "unknown";
      const campusKey = campusLabelAr(entry.campus) ?? "unknown";
      if (!matchesSelection(years, yearKey)) return false;
      if (!matchesSelection(campuses, campusKey)) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.login.toLowerCase().includes(q) ||
        yearKey.includes(q) ||
        campusKey.toLowerCase().includes(q)
      );
    });
  }, [entries, query, years, campuses]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const response = await lookupListProfile(list.id, login);
      if (!response.success) {
        toast.error(response.error);
        return;
      }
      setLogin("");
      setResult({
        status: response.status === "already" ? "already" : "confirm",
        profile: response.profile,
      });
    });
  }

  function onConfirmAdd() {
    if (!result || result.status !== "confirm") return;
    const profile = result.profile;
    startTransition(async () => {
      const response = await addListProfile(list.id, profile.login);
      if (!response.success) {
        toast.error(response.error);
        return;
      }
      setResult({ status: response.status, profile: response.profile });
      if (response.status === "added") router.refresh();
    });
  }

  function onRemove() {
    if (!removing) return;
    startTransition(async () => {
      const response = await removeListEntry(list.id, removing.id);
      if (!response.success) {
        toast.error(response.error);
        return;
      }
      toast.success("تمت الإزالة من اللائحة");
      setRemoving(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-primary">
              <Link href="/dashboard/lists" className="transition hover:underline">
                اللوائح
              </Link>
            </p>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {list.name}
            </h1>
            <p className="max-w-lg text-foreground/65">
              ابحث عن حساب 42، ثم أكّد إضافته إلى هذه اللائحة.
            </p>
          </div>
        </div>
        {canManage && (
          <form
            onSubmit={onSearch}
            className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="list-login">حساب 42</Label>
              <Input
                id="list-login"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                placeholder="login"
                dir="ltr"
                required
                autoComplete="off"
                className="bg-background"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "جاري البحث…" : "بحث"}
            </Button>
          </form>
        )}
      </header>

      <DashboardToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="ابحث بالاسم أو اللوجين أو الحرم…"
        menuTitle="تصفية الحسابات"
        onReset={() => {
          setYears([]);
          setCampuses([]);
        }}
        groups={[
          {
            title: "السنة",
            selected: years,
            onChange: setYears,
            options: yearOptions.map((year) => ({
              key: year,
              label: year === "unknown" ? "بدون سنة" : year,
              tone: "sky" as const,
              icon: <Calendar />,
            })),
          },
          {
            title: "الحرم",
            selected: campuses,
            onChange: setCampuses,
            options: campusOptions.map((campus) => ({
              key: campus,
              label: campus === "unknown" ? "بدون حرم" : campus,
              tone: "amber" as const,
              icon: <MapPin />,
            })),
          },
        ]}
        layout={layout}
        onLayoutChange={setLayout}
      />

      {filtered.length > 0 ? (
        layout === "list" ? (
          <ul className="space-y-3">
            {filtered.map((entry) => {
              const items: KebabMenuItem[] = canManage
                ? [
                    {
                      key: "remove",
                      label: "إزالة",
                      icon: <Trash2 className="size-3.5" />,
                      variant: "destructive",
                      onClick: () => setRemoving(entry),
                    },
                  ]
                : [];
              return (
                <li
                  key={entry.id}
                  className={`relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
                    openMenuId === entry.id ? "z-50" : "z-0"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <EntryAvatar entry={entry} className="size-14" />
                    <div className="min-w-0 space-y-1.5">
                      <h3 className="truncate font-kufam text-lg text-foreground">
                        {entry.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`https://profile.intra.42.fr/users/${encodeURIComponent(entry.login)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="text-sm text-muted-foreground underline-offset-2 transition hover:text-primary hover:underline"
                        >
                          @{entry.login}
                        </Link>
                        <EntryMeta entry={entry} />
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="relative shrink-0 self-end sm:self-center">
                      <ListRowActions
                        items={items}
                        open={openMenuId === entry.id}
                        onToggle={() =>
                          setOpenMenuId(openMenuId === entry.id ? null : entry.id)
                        }
                        onClose={() => setOpenMenuId(null)}
                        menuPlacement="up"
                        ariaLabel="خيارات الحساب"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((entry) => {
              const items: KebabMenuItem[] = canManage
                ? [
                    {
                      key: "remove",
                      label: "إزالة",
                      icon: <Trash2 className="size-3.5" />,
                      variant: "destructive",
                      onClick: () => setRemoving(entry),
                    },
                  ]
                : [];
              return (
                <article
                  key={entry.id}
                  className={`group relative flex flex-col rounded-3xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] ${
                    openMenuId === entry.id ? "z-50" : "z-0"
                  }`}
                >
                  {canManage && (
                    <div className="absolute top-3 left-3 z-20">
                      <KebabMenu
                        items={items}
                        open={openMenuId === entry.id}
                        onToggle={() =>
                          setOpenMenuId(openMenuId === entry.id ? null : entry.id)
                        }
                        onClose={() => setOpenMenuId(null)}
                        placement="down"
                        ariaLabel="خيارات الحساب"
                        buttonClassName="rounded-lg bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col items-center px-2 pt-4 pb-2">
                    <EntryAvatar entry={entry} className="mb-4 size-20" />
                    <h3 className="mb-1 text-center font-kufam text-xl font-medium text-foreground">
                      {entry.name}
                    </h3>
                    <Link
                      href={`https://profile.intra.42.fr/users/${encodeURIComponent(entry.login)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="mb-2 text-center text-sm text-muted-foreground underline-offset-2 transition hover:text-primary hover:underline"
                    >
                      @{entry.login}
                    </Link>
                    <EntryMeta
                      entry={entry}
                      className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        <p className="rounded-3xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          {entries.length === 0
            ? "لا حسابات في هذه اللائحة بعد."
            : "لا نتائج تطابق البحث أو التصفية."}
        </p>
      )}

      <ProfileResultModal
        open={Boolean(result)}
        status={result?.status ?? "added"}
        profile={result?.profile ?? null}
        pending={pending && result?.status === "confirm"}
        onClose={() => {
          if (!pending) setResult(null);
        }}
        onConfirm={onConfirmAdd}
      />

      <ConfirmDeleteModal
        open={Boolean(removing)}
        title="إزالة من اللائحة"
        description={
          removing ? `هل تريد إزالة «${removing.name}» من هذه اللائحة؟` : ""
        }
        pending={pending}
        onCancel={() => {
          if (!pending) setRemoving(null);
        }}
        onConfirm={onRemove}
      />
    </div>
  );
}
