"use client";

import type {
  NetworkKind,
  NetworkProfile,
  NetworkRank,
} from "@/app/actions/network";
import {
  KebabMenu,
  type KebabMenuItem,
} from "@/components/dashboard/kebab-menu";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import {
  StatusBadge,
  type BadgeTone,
} from "@/components/dashboard/status-badge";
import { Rosette } from "@/components/islamic-motif";
import type { ViewLayout } from "@/components/layout-toggle";
import { Button } from "@/components/ui/button";
import { campusLabelAr, RANK_AR } from "@/lib/network-labels";
import {
  Calendar,
  Crown,
  GraduationCap,
  Link2,
  MapPin,
  Medal,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Trophy,
  UserRoundCheck,
  Waves,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function ftProfileUrl(login: string): string {
  return `https://profile.intra.42.fr/users/${encodeURIComponent(login)}`;
}

const RANK_TONE: Record<NetworkRank, BadgeTone> = {
  A: "emerald",
  B: "sky",
  C: "amber",
  D: "slate",
};

const RANK_ICON: Record<NetworkRank, LucideIcon> = {
  A: Crown,
  B: Trophy,
  C: Medal,
  D: Star,
};

const KIND_LABEL: Record<NetworkKind, string> = {
  student: "طالب",
  pooler: "سباح",
};

function RankBadge({
  rank,
  size = "md",
}: {
  rank: NetworkRank;
  size?: "sm" | "md";
}) {
  const Icon = RANK_ICON[rank];
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  return (
    <StatusBadge
      tone={RANK_TONE[rank]}
      icon={<Icon className={iconSize} />}
      label={`رتبة ${RANK_AR[rank]}`}
      size={size}
      iconOnly
    />
  );
}

function KindBadge({
  kind,
  size = "md",
}: {
  kind: NetworkKind;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  return (
    <StatusBadge
      tone={kind === "student" ? "rose" : "amber"}
      icon={
        kind === "student" ? (
          <GraduationCap className={iconSize} />
        ) : (
          <Waves className={iconSize} />
        )
      }
      label={KIND_LABEL[kind]}
      size={size}
      iconOnly
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
          iconOnly
        />
      ) : null}
      {profile.has_connection ? (
        <StatusBadge
          tone="sky"
          icon={<Link2 className={iconSize} />}
          label="متصل"
          size={size}
          iconOnly
        />
      ) : null}
    </>
  );
}

function LoginLink({
  login,
  className,
}: {
  login: string;
  className?: string;
}) {
  return (
    <Link
      href={ftProfileUrl(login)}
      target="_blank"
      rel="noopener noreferrer"
      dir="ltr"
      onClick={(e) => e.stopPropagation()}
      className={
        className ??
        "text-sm text-muted-foreground underline-offset-2 transition hover:text-primary hover:underline"
      }
    >
      @{login}
    </Link>
  );
}

function MetaChips({
  profile,
  className,
}: {
  profile: NetworkProfile;
  className?: string;
}) {
  const campus = campusLabelAr(profile.campus);
  const year = profile.pool_year;

  if (!campus && year == null) return null;

  return (
    <div
      className={
        className ??
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
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
  onRefresh,
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
  onRefresh: (profile: NetworkProfile) => void;
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
        key: "refresh",
        label: "تحديث من 42",
        icon: <RefreshCw className="size-3.5" />,
        onClick: () => onRefresh(profile),
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
                  <KindBadge kind={profile.kind} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <LoginLink login={profile.login} />
                  <MetaChips
                    profile={profile}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
                  />
                </div>
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

          <div className="flex flex-1 flex-col items-center px-2 pt-4 pb-2">
            <Avatar profile={profile} className="mb-4 size-20" />
            <h3 className="mb-1 text-center font-kufam text-xl font-medium text-foreground">
              {profile.name}
            </h3>
            <LoginLink
              login={profile.login}
              className="mb-2 text-center text-sm text-muted-foreground underline-offset-2 transition hover:text-primary hover:underline"
            />
            <MetaChips
              profile={profile}
              className="mb-3 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
            />
            <div className="mb-2 flex flex-wrap justify-center gap-1.5">
              <KindBadge kind={profile.kind} />
              <RankBadge rank={profile.rank} />
              <ConnectionChips profile={profile} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
