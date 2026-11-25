"use client";

import {
  deleteGameTemplate,
  duplicateGameTemplate,
} from "@/app/actions/games";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KebabMenu, type KebabMenuItem } from "@/components/dashboard/kebab-menu";
import {
  matchesSelection,
  SearchFilterBar,
} from "@/components/dashboard/search-filter-bar";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { useStartGame } from "@/components/games/use-start-game";
import { Button } from "@/components/ui/button";
import { GAMES_PATH } from "@/lib/games-access";
import {
  GAME_STATUS_LABELS,
  type GameTemplateStatus,
  type GameTemplateSummary,
} from "@/lib/games";
import {
  CheckCircle2,
  Copy,
  Eye,
  Gamepad2,
  Loader2,
  Pencil,
  PencilLine,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function GameStatusBadge({ status }: { status: GameTemplateStatus }) {
  return status === "ready" ? (
    <StatusBadge
      tone="emerald"
      size="sm"
      icon={<CheckCircle2 className="size-3" />}
      label={GAME_STATUS_LABELS.ready}
    />
  ) : (
    <StatusBadge
      tone="amber"
      size="sm"
      icon={<PencilLine className="size-3" />}
      label={GAME_STATUS_LABELS.draft}
    />
  );
}

export function GamesManager({
  templates,
  canManage,
}: {
  templates: GameTemplateSummary[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { start, pendingId: startingId } = useStartGame();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<GameTemplateSummary | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter(
      (template) =>
        matchesSelection(statusFilter, template.status) &&
        (!needle ||
          template.title.toLowerCase().includes(needle) ||
          template.description.toLowerCase().includes(needle)),
    );
  }, [templates, query, statusFilter]);

  const readyCount = templates.filter((t) => t.status === "ready").length;

  function onDuplicate(template: GameTemplateSummary) {
    startTransition(async () => {
      const result = await duplicateGameTemplate(template.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم نسخ القالب");
      router.push(`${GAMES_PATH}/${result.id}`);
    });
  }

  function onDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteGameTemplate(deleting.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف القالب");
      setDeleting(null);
      router.refresh();
    });
  }

  function menuItems(template: GameTemplateSummary): KebabMenuItem[] {
    if (!canManage) {
      return [
        {
          key: "view",
          label: "عرض",
          icon: <Eye className="size-4" />,
          href: `${GAMES_PATH}/${template.id}`,
        },
      ];
    }
    return [
      {
        key: "edit",
        label: "تعديل",
        icon: <Pencil className="size-4" />,
        href: `${GAMES_PATH}/${template.id}`,
      },
      {
        key: "start",
        label: "بدء لعبة",
        icon: <Play className="size-4" />,
        disabled: template.status !== "ready" || startingId !== null,
        onClick: () => void start(template.id),
      },
      {
        key: "duplicate",
        label: "نسخ",
        icon: <Copy className="size-4" />,
        disabled: pending,
        onClick: () => onDuplicate(template),
      },
      {
        key: "delete",
        label: "حذف",
        icon: <Trash2 className="size-4" />,
        variant: "destructive",
        onClick: () => setDeleting(template),
      },
    ];
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <DashboardHeader
        eyebrow="الألعاب التفاعلية"
        title="قوالب الألعاب"
        description="أنشئ مسابقات بأسئلة واختيارات، ثم ابدأ لعبة مباشرة يدخلها اللاعبون برمز."
        action={
          canManage ? (
            <Button asChild className="gap-2">
              <Link href={`${GAMES_PATH}/new`}>
                <Plus className="size-4" />
                قالب جديد
              </Link>
            </Button>
          ) : undefined
        }
        stats={[
          { key: "all", label: "القوالب", value: templates.length },
          { key: "ready", label: "جاهزة", value: readyCount },
          { key: "draft", label: "مسودات", value: templates.length - readyCount },
        ]}
      />

      {templates.length > 0 && (
        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder="ابحث في القوالب…"
          menuTitle="تصفية القوالب"
          groups={[
            {
              title: "الحالة",
              selected: statusFilter,
              onChange: setStatusFilter,
              options: [
                {
                  key: "ready",
                  label: GAME_STATUS_LABELS.ready,
                  tone: "emerald",
                  icon: <CheckCircle2 />,
                },
                {
                  key: "draft",
                  label: GAME_STATUS_LABELS.draft,
                  tone: "amber",
                  icon: <PencilLine />,
                },
              ],
            },
          ]}
          onReset={() => setStatusFilter([])}
        />
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gamepad2 className="size-7" />
          </span>
          <div className="space-y-1">
            <p className="font-kufam text-lg text-foreground">لا توجد قوالب بعد</p>
            <p className="text-sm text-muted-foreground">
              ابدأ بإنشاء أول مسابقة وأضف إليها أسئلتك.
            </p>
          </div>
          {canManage && (
            <Button asChild className="gap-2">
              <Link href={`${GAMES_PATH}/new`}>
                <Plus className="size-4" />
                قالب جديد
              </Link>
            </Button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          لا توجد نتائج مطابقة.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const starting = startingId === template.id;
            return (
              <li
                key={template.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/70 shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]"
              >
                <Link
                  href={`${GAMES_PATH}/${template.id}`}
                  className="relative block aspect-video bg-linear-to-br from-primary/15 to-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={template.title}
                >
                  {template.cover_image_url ? (
                    <Image
                      src={template.cover_image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-primary/50">
                      <Gamepad2 className="size-10" />
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`${GAMES_PATH}/${template.id}`}
                      className="min-w-0 hover:underline"
                    >
                      <h2 className="truncate font-kufam text-lg text-foreground">
                        {template.title}
                      </h2>
                    </Link>
                    <KebabMenu
                      items={menuItems(template)}
                      open={openMenuId === template.id}
                      onToggle={() =>
                        setOpenMenuId(openMenuId === template.id ? null : template.id)
                      }
                      onClose={() => setOpenMenuId(null)}
                      ariaLabel={`خيارات ${template.title}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <GameStatusBadge status={template.status} />
                    <span>{template.question_count} سؤال</span>
                    <span aria-hidden>·</span>
                    <span>آخر تعديل {formatDate(template.updated_at)}</span>
                  </div>

                  {canManage && (
                    <Button
                      type="button"
                      variant={template.status === "ready" ? "default" : "outline"}
                      size="sm"
                      className="mt-auto gap-2"
                      disabled={template.status !== "ready" || startingId !== null}
                      title={
                        template.status === "ready"
                          ? undefined
                          : "اجعل القالب «جاهزاً» لبدء لعبة"
                      }
                      onClick={() => void start(template.id)}
                    >
                      {starting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="size-4" />
                      )}
                      {starting ? "جاري التشغيل…" : "بدء لعبة"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف القالب"
        description={
          deleting
            ? `هل تريد حذف قالب «${deleting.title}»؟ تبقى سجلات الألعاب السابقة محفوظة.`
            : ""
        }
        pending={pending}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
        onConfirm={onDelete}
      />
    </div>
  );
}
