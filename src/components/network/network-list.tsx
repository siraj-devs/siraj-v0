"use client";

import type { NetworkProfile, NetworkRank } from "@/app/actions/network";
import {
  KebabMenu,
  type KebabMenuItem,
} from "@/components/dashboard/kebab-menu";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import { StatusBadge, type BadgeTone } from "@/components/dashboard/status-badge";
import { Rosette } from "@/components/islamic-motif";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import {
  Link2,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import Image from "next/image";

const RANK_TONE: Record<NetworkRank, BadgeTone> = {
  A: "emerald",
  B: "sky",
  C: "amber",
  D: "slate",
};

function RankBadge({
  rank,
  size = "md",
}: {
  rank: NetworkRank;
  size?: "sm" | "md";
}) {
  return (
    <StatusBadge
      tone={RANK_TONE[rank]}
      icon={
        <span className="text-[10px] font-bold leading-none">{rank}</span>
      }
      label={`رتبة ${rank}`}
      size={size}
    />
  );
}

function ConnectionChips({
  profile,
  size = "md",
}: {
  profile: NetworkProfile;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  return (
    <>
      {profile.is_member ? (
        <StatusBadge
          tone="violet"
          icon={<UserRoundCheck className={iconSize} />}
          label="عضو"
          size={size}
        />
      ) : (
        <StatusBadge
          tone="slate"
          icon={<UserRound className={iconSize} />}
          label="غير عضو"
          size={size}
        />
      )}
      {profile.has_connection ? (
        <StatusBadge
          tone="sky"
          icon={<Link2 className={iconSize} />}
          label="متصل"
          size={size}
        />
      ) : null}
    </>
  );
}

function Avatar({
  profile,
  className,
}: {
  profile: NetworkProfile;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-muted/30 ${className ?? "size-14"}`}
    >
      {profile.avatar ? (
        <Image
          src={profile.avatar}
          alt={profile.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-primary/35">
          <Rosette className="size-1/2" />
        </div>
      )}
    </div>
  );
}

export function NetworkList({
  profiles,
  allProfilesCount,
  layout,
  canManage,
  openMenuId,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDelete,
  onCreate,
}: {
  profiles: NetworkProfile[];
  allProfilesCount: number;
  layout: ViewLayout;
  canManage: boolean;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onEdit: (profile: NetworkProfile) => void;
  onDelete: (profile: NetworkProfile) => void;
  onCreate: () => void;
}) {
  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <Rosette className="mb-4 size-10 text-primary/25" />
        <p className="font-kufam text-lg text-foreground">لا نتائج</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {allProfilesCount === 0
            ? "أضف أول حساب 42 إلى الشبكة ليظهر هنا."
            : "جرّب تغيير نص البحث أو تصفية الرتبة."}
        </p>
        {canManage && allProfilesCount === 0 && (
          <Button onClick={onCreate} className="mt-6 gap-2">
            <Plus className="size-4" />
            إضافة إلى الشبكة
          </Button>
        )}
      </div>
    );
  }

  function itemsFor(profile: NetworkProfile): KebabMenuItem[] {
    if (!canManage) return [];
    return [
      {
        key: "edit",
        label: "تعديل الرتبة",
        icon: <Pencil className="size-3.5" />,
        onClick: () => onEdit(profile),
      },
      {
        key: "delete",
        label: "حذف",
        icon: <Trash2 className="size-3.5" />,
        variant: "destructive",
        onClick: () => onDelete(profile),
      },
    ];
  }

  if (layout === "list") {
    return (
      <ul className="space-y-3">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className={`relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
              openMenuId === profile.id ? "z-50" : "z-0"
            }`}
          >
            <div className="flex min-w-0 items-center gap-4">
              <Avatar profile={profile} className="size-14 shrink-0" />
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-kufam text-lg text-foreground">
                    {profile.name}
                  </h3>
                  <RankBadge rank={profile.rank} size="sm" />
                </div>
                <p className="truncate text-sm text-muted-foreground" dir="ltr">
                  @{profile.login}
                  {profile.pool_year != null ? ` · ${profile.pool_year}` : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <ConnectionChips profile={profile} size="sm" />
                </div>
              </div>
            </div>

            {canManage && (
              <div className="relative shrink-0 self-end sm:self-center">
                <ListRowActions
                  items={itemsFor(profile)}
                  open={openMenuId === profile.id}
                  onToggle={() => onToggleMenu(profile.id)}
                  onClose={onCloseMenu}
                  menuPlacement="up"
                  ariaLabel="خيارات الشبكة"
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {profiles.map((profile) => (
        <article
          key={profile.id}
          className={`group relative flex flex-col rounded-3xl border border-border/80 bg-background/70 p-4 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] ${
            openMenuId === profile.id ? "z-50" : "z-0"
          }`}
        >
          {canManage && (
            <div className="absolute top-3 left-3 z-20">
              <KebabMenu
                items={itemsFor(profile)}
                open={openMenuId === profile.id}
                onToggle={() => onToggleMenu(profile.id)}
                onClose={onCloseMenu}
                placement="down"
                ariaLabel="خيارات الشبكة"
                buttonClassName="rounded-lg bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition hover:bg-background hover:text-foreground"
              />
            </div>
          )}

          <div className="flex flex-1 flex-col items-center px-2 pb-2 pt-4">
            <Avatar profile={profile} className="mb-4 size-20" />
            <h3 className="mb-1 text-center font-kufam text-xl font-medium text-foreground">
              {profile.name}
            </h3>
            <p
              className="mb-3 text-center text-sm text-muted-foreground"
              dir="ltr"
            >
              @{profile.login}
            </p>
            <div className="mb-2 flex flex-wrap justify-center gap-1.5">
              <RankBadge rank={profile.rank} />
              {profile.pool_year != null && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground ring-1 ring-inset ring-border/70">
                  {profile.pool_year}
                </span>
              )}
            </div>
            <div className="mt-auto flex flex-wrap justify-center gap-1.5 pt-2">
              <ConnectionChips profile={profile} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
