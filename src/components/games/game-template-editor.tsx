"use client";

import {
  deleteGameTemplate,
  saveGameTemplate,
  uploadGameImage,
} from "@/app/actions/games";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { FormSection } from "@/components/dashboard/form-section";
import { SegmentedChoiceField } from "@/components/dashboard/segmented-choice-field";
import { ThumbnailField } from "@/components/dashboard/thumbnail-field";
import { GameQuestionEditor } from "@/components/games/game-question-editor";
import { GameStatusBadge } from "@/components/games/games-manager";
import { useStartGame } from "@/components/games/use-start-game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes";
import { GAMES_PATH } from "@/lib/games-access";
import {
  cloneQuestion,
  collectTemplateIssues,
  GAME_LIMITS,
  GAME_POINTS_MODE_LABELS,
  GAME_STATUS_LABELS,
  gameTemplateDraftSchema,
  makeQuestion,
  makeTemplateDraft,
  type GameQuestionDraft,
  type GameQuestionType,
  type GameTemplateDraft,
  type GameTemplateRecord,
  type GameTemplateStatus,
} from "@/lib/games";
import {
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  Gauge,
  ListOrdered,
  Loader2,
  PencilLine,
  Play,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Timer,
  Trash2,
  Type,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

export function GameTemplateEditor({
  template,
  canManage,
}: {
  /** `null` when creating a new template. */
  template: GameTemplateRecord | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [deletingPending, startDeleting] = useTransition();
  const { start, pendingId: startingId } = useStartGame();

  const [templateId, setTemplateId] = useState(template?.id ?? null);
  const [version, setVersion] = useState(template?.version ?? null);
  const [draft, setDraft] = useState<GameTemplateDraft>(
    () => template?.draft ?? makeTemplateDraft(),
  );
  const [savedJson, setSavedJson] = useState(() =>
    template ? JSON.stringify(template.draft) : null,
  );
  const [savedStatus, setSavedStatus] = useState<GameTemplateStatus | null>(
    template?.draft.status ?? null,
  );
  const [showIssues, setShowIssues] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = canManage && JSON.stringify(draft) !== savedJson;
  useUnsavedChangesWarning(dirty);

  const issues = useMemo(() => collectTemplateIssues(draft), [draft]);
  const visibleIssues = showIssues || draft.status === "ready" ? issues : [];
  const templateIssues = visibleIssues.filter((issue) => issue.questionIndex === null);
  const issuesByQuestion = (index: number) =>
    visibleIssues
      .filter((issue) => issue.questionIndex === index)
      .map((issue) => issue.message);

  const canStart =
    canManage && templateId !== null && !dirty && savedStatus === "ready";

  function updateQuestion(index: number, next: GameQuestionDraft) {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) => (i === index ? next : question)),
    }));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.questions.length) return prev;
      const questions = [...prev.questions];
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...prev, questions };
    });
  }

  function insertQuestion(at: number, question: GameQuestionDraft) {
    setDraft((prev) => {
      if (prev.questions.length >= GAME_LIMITS.questionsMax) return prev;
      const questions = [...prev.questions];
      questions.splice(at, 0, question);
      return { ...prev, questions };
    });
  }

  function addQuestion(type: GameQuestionType) {
    insertQuestion(draft.questions.length, makeQuestion(type));
  }

  function removeQuestion(index: number) {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  async function uploadImage(file: File | null, apply: (url: string | null) => void) {
    if (!file) {
      apply(null);
      return;
    }
    setUploads((count) => count + 1);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadGameImage(formData);
      if (result.success) apply(result.url);
      else toast.error(result.error);
    } catch {
      toast.error("تعذر رفع الصورة");
    } finally {
      setUploads((count) => count - 1);
    }
  }

  function onSave(event?: FormEvent) {
    event?.preventDefault();
    if (!canManage || saving) return;
    setShowIssues(true);

    const structural = gameTemplateDraftSchema.safeParse(draft);
    if (!structural.success) {
      toast.error(structural.error.issues[0]?.message ?? "بيانات غير صالحة");
      return;
    }
    if (draft.status === "ready" && issues.length > 0) {
      toast.error("صحّح الأخطاء قبل حفظ القالب كجاهز، أو احفظه كمسودة.");
      return;
    }

    const snapshot = draft;
    startSaving(async () => {
      const result = await saveGameTemplate({
        id: templateId,
        expectedVersion: version,
        draft: snapshot,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setSavedJson(JSON.stringify(snapshot));
      setSavedStatus(snapshot.status);
      setVersion(result.version);
      toast.success("تم حفظ القالب");
      if (templateId === null) {
        setTemplateId(result.id);
        router.replace(`${GAMES_PATH}/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!templateId) return;
    startDeleting(async () => {
      const result = await deleteGameTemplate(templateId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف القالب");
      setSavedJson(JSON.stringify(draft));
      router.push(GAMES_PATH);
    });
  }

  const startHint = !templateId
    ? "احفظ القالب أولاً"
    : dirty
      ? "احفظ التغييرات أولاً"
      : savedStatus !== "ready"
        ? "اجعل حالة القالب «جاهزة» ثم احفظ"
        : undefined;

  return (
    <form onSubmit={onSave} className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-16">
      <header className="sticky top-[73px] z-20 flex flex-col gap-3 border-b border-border/70 bg-background/90 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            href={GAMES_PATH}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowRight className="size-4" />
            قوالب الألعاب
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="truncate font-kufam text-2xl text-foreground">
              {draft.title.trim() || (templateId ? "قالب بدون عنوان" : "قالب جديد")}
            </h1>
            {savedStatus && <GameStatusBadge status={savedStatus} />}
          </div>
          {version !== null && (
            <p className="text-xs text-muted-foreground">
              الإصدار {version}
              {dirty && " · تغييرات غير محفوظة"}
            </p>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {templateId && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="حذف القالب"
                title="حذف القالب"
                className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!canStart || startingId !== null}
              title={startHint}
              onClick={() => templateId && void start(templateId)}
            >
              {startingId ? <Loader2 className="animate-spin" /> : <Play />}
              {startingId ? "جاري التشغيل…" : "بدء لعبة"}
            </Button>
            <Button type="submit" className="gap-2" disabled={saving || uploads > 0}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? "جاري الحفظ…" : uploads > 0 ? "جاري رفع الصورة…" : "حفظ"}
            </Button>
          </div>
        )}
      </header>

      {!canManage && (
        <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          لديك صلاحية المشاهدة فقط.
        </p>
      )}

      <fieldset disabled={!canManage} className="flex min-w-0 flex-col gap-6">
        {templateIssues.length > 0 && (
          <ul
            role="alert"
            className="space-y-1 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {templateIssues.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <FormSection icon={<Type />} title="تفاصيل القالب">
            <div className="space-y-2">
              <Label htmlFor="game-title">العنوان</Label>
              <Input
                id="game-title"
                required
                maxLength={GAME_LIMITS.titleMax}
                value={draft.title}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="مثال: مسابقة السيرة النبوية"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="game-description">الوصف</Label>
              <Textarea
                id="game-description"
                maxLength={GAME_LIMITS.descriptionMax}
                value={draft.description}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
              />
            </div>
            <ThumbnailField
              label="صورة الغلاف"
              imageUrl={draft.coverImageUrl}
              accept="image/jpeg,image/png,image/webp,image/gif"
              hint="JPEG، PNG، WebP — يُفضّل نسبة 16:9"
              onChange={(file) =>
                void uploadImage(file, (url) =>
                  setDraft((prev) => ({ ...prev, coverImageUrl: url })),
                )
              }
            />
          </FormSection>

          <FormSection icon={<Settings2 />} title="الإعدادات الافتراضية">
            <div className="space-y-2">
              <Label htmlFor="game-time">مدة السؤال (ثانية)</Label>
              <div className="relative">
                <Timer className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="game-time"
                  type="number"
                  inputMode="numeric"
                  min={GAME_LIMITS.timeMinSec}
                  max={GAME_LIMITS.timeMaxSec}
                  className="pr-10"
                  value={draft.settings.timePerQuestionSec || ""}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        timePerQuestionSec: Number.parseInt(event.target.value, 10) || 0,
                      },
                    }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                من {GAME_LIMITS.timeMinSec} إلى {GAME_LIMITS.timeMaxSec} ثانية، ويمكن
                تغييرها لكل سؤال.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-3">
              {(
                [
                  ["shuffleQuestions", "خلط ترتيب الأسئلة"],
                  ["shuffleOptions", "خلط ترتيب الخيارات"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`game-${key}`}>{label}</Label>
                  <Switch
                    id={`game-${key}`}
                    checked={draft.settings[key]}
                    onCheckedChange={(checked) =>
                      setDraft((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, [key]: checked },
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <SegmentedChoiceField
              legend="احتساب النقاط"
              name="game-points-mode"
              columns={3}
              value={draft.settings.pointsMode}
              onChange={(pointsMode) =>
                setDraft((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, pointsMode },
                }))
              }
              options={[
                {
                  value: "standard",
                  label: GAME_POINTS_MODE_LABELS.standard,
                  icon: <Zap />,
                  activeClassName: "border-primary/40 bg-primary/10 text-foreground",
                },
                {
                  value: "fixed",
                  label: GAME_POINTS_MODE_LABELS.fixed,
                  icon: <Gauge />,
                  activeClassName: "border-primary/40 bg-primary/10 text-foreground",
                },
                {
                  value: "none",
                  label: GAME_POINTS_MODE_LABELS.none,
                  icon: <Sparkles />,
                  activeClassName: "border-primary/40 bg-primary/10 text-foreground",
                },
              ]}
            />

            <SegmentedChoiceField
              legend="الحالة"
              name="game-status"
              value={draft.status}
              onChange={(status) => {
                setDraft((prev) => ({ ...prev, status }));
                if (status === "ready") setShowIssues(true);
              }}
              options={[
                {
                  value: "draft",
                  label: GAME_STATUS_LABELS.draft,
                  icon: <PencilLine />,
                  activeClassName: "border-amber-400/50 bg-amber-50 text-amber-900",
                },
                {
                  value: "ready",
                  label: GAME_STATUS_LABELS.ready,
                  icon: <CheckCircle2 />,
                  activeClassName: "border-emerald-400/50 bg-emerald-50 text-emerald-900",
                },
              ]}
            />
          </FormSection>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-kufam text-xl text-foreground">
            الأسئلة{" "}
            <span className="text-base text-muted-foreground">
              ({draft.questions.length})
            </span>
          </h2>
        </div>

        {draft.questions.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            لا توجد أسئلة بعد. أضف سؤالك الأول.
          </p>
        )}

        <ol className="flex flex-col gap-4">
          {draft.questions.map((question, index) => (
            <li key={question.id}>
              <GameQuestionEditor
                question={question}
                index={index}
                total={draft.questions.length}
                settings={draft.settings}
                issues={issuesByQuestion(index)}
                onChange={(next) => updateQuestion(index, next)}
                onMove={(direction) => moveQuestion(index, direction)}
                onDuplicate={() => insertQuestion(index + 1, cloneQuestion(question))}
                onRemove={() => removeQuestion(index)}
                onImageFile={(file) =>
                  void uploadImage(file, (url) =>
                    setDraft((prev) => ({
                      ...prev,
                      questions: prev.questions.map((q) =>
                        q.id === question.id ? { ...q, mediaUrl: url } : q,
                      ),
                    })),
                  )
                }
              />
            </li>
          ))}
        </ol>

        {canManage && draft.questions.length < GAME_LIMITS.questionsMax && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => addQuestion("single_choice")}
            >
              <Plus />
              <ListOrdered />
              سؤال اختيار من متعدد
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => addQuestion("true_false")}
            >
              <Plus />
              <CheckCheck />
              سؤال صح أو خطأ
            </Button>
          </div>
        )}
      </fieldset>

      <ConfirmDeleteModal
        open={confirmDelete}
        title="حذف القالب"
        description={`هل تريد حذف قالب «${draft.title || "بدون عنوان"}»؟ تبقى سجلات الألعاب السابقة محفوظة.`}
        pending={deletingPending}
        onCancel={() => {
          if (!deletingPending) setConfirmDelete(false);
        }}
        onConfirm={onDelete}
      />
    </form>
  );
}
