"use client";

import { SegmentedChoiceField } from "@/components/dashboard/segmented-choice-field";
import { ThumbnailField } from "@/components/dashboard/thumbnail-field";
import {
  GameQuestionPreview,
  OPTION_STYLES,
} from "@/components/games/game-question-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  changeQuestionType,
  DEFAULT_SLIDER,
  GAME_LIMITS,
  GAME_QUESTION_TYPE_LABELS,
  type GameOptionDraft,
  type GameQuestionDraft,
  type GameQuestionType,
  type GameSettings,
  type GameSliderConfig,
} from "@/lib/games";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  CheckCheck,
  CircleDot,
  Copy,
  ListChecks,
  Plus,
  Puzzle,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

const TYPE_ICONS: Record<GameQuestionType, ReactNode> = {
  single_choice: <CircleDot />,
  multi_choice: <ListChecks />,
  true_false: <CheckCheck />,
  slider: <SlidersHorizontal />,
  puzzle: <Puzzle />,
};

export const QUESTION_TYPE_ORDER: GameQuestionType[] = [
  "single_choice",
  "multi_choice",
  "true_false",
  "slider",
  "puzzle",
];

export function QuestionTypeIcon({ type }: { type: GameQuestionType }) {
  return <>{TYPE_ICONS[type]}</>;
}

function parseIntOrNull(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNumber(value: string) {
  return value.trim() === "" ? Number.NaN : Number(value);
}

function numberValue(value: number) {
  return Number.isFinite(value) ? value : "";
}

function OptionShape({ index }: { index: number }) {
  const style = OPTION_STYLES[index % OPTION_STYLES.length];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg text-white",
        style.tile,
      )}
      aria-hidden
    >
      <Icon className="size-4 fill-white/90" />
    </span>
  );
}

function SliderFields({
  idPrefix,
  slider,
  onChange,
}: {
  idPrefix: string;
  slider: GameSliderConfig;
  onChange: (next: GameSliderConfig) => void;
}) {
  const fields: { key: Exclude<keyof GameSliderConfig, "unit">; label: string; hint?: string }[] = [
    { key: "min", label: "الحد الأدنى" },
    { key: "max", label: "الحد الأعلى" },
    { key: "step", label: "الخطوة" },
    { key: "correctValue", label: "الإجابة الصحيحة" },
    { key: "tolerance", label: "هامش الخطأ (±)", hint: "0 = إجابة دقيقة فقط" },
  ];

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium leading-none">إعدادات الشريط</legend>
      <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</Label>
            <Input
              id={`${idPrefix}-${field.key}`}
              type="number"
              inputMode="decimal"
              step="any"
              dir="ltr"
              value={numberValue(slider[field.key])}
              onChange={(event) =>
                onChange({ ...slider, [field.key]: parseNumber(event.target.value) })
              }
            />
            {field.hint && (
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            )}
          </div>
        ))}
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-unit`}>الوحدة (اختياري)</Label>
          <Input
            id={`${idPrefix}-unit`}
            value={slider.unit}
            maxLength={GAME_LIMITS.sliderUnitMax}
            placeholder="مثال: سنة"
            onChange={(event) => onChange({ ...slider, unit: event.target.value })}
          />
        </div>
      </div>
    </fieldset>
  );
}

export function GameQuestionEditor({
  question,
  index,
  total,
  settings,
  issues,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  onImageFile,
}: {
  question: GameQuestionDraft;
  index: number;
  total: number;
  settings: GameSettings;
  issues: string[];
  onChange: (next: GameQuestionDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onImageFile: (file: File | null) => void;
}) {
  const fieldId = (name: string) => `q-${question.id}-${name}`;
  const isPuzzle = question.type === "puzzle";
  const isTrueFalse = question.type === "true_false";
  const isMulti = question.type === "multi_choice";
  const minOptions = isPuzzle ? GAME_LIMITS.puzzleItemsMin : GAME_LIMITS.optionsMin;
  const maxOptions = isPuzzle ? GAME_LIMITS.puzzleItemsMax : GAME_LIMITS.optionsMax;
  const canAddOption = !isTrueFalse && question.options.length < maxOptions;
  const canRemoveOption = !isTrueFalse && question.options.length > minOptions;
  const itemWord = isPuzzle ? "العنصر" : "الخيار";

  function update(patch: Partial<GameQuestionDraft>) {
    onChange({ ...question, ...patch });
  }

  function updateOption(optionId: string, patch: Partial<GameOptionDraft>) {
    update({
      options: question.options.map((option) =>
        option.id === optionId ? { ...option, ...patch } : option,
      ),
    });
  }

  function toggleCorrect(optionId: string) {
    update({
      options: question.options.map((option) =>
        isMulti
          ? option.id === optionId
            ? { ...option, isCorrect: !option.isCorrect }
            : option
          : { ...option, isCorrect: option.id === optionId },
      ),
    });
  }

  function moveOption(optionIndex: number, direction: -1 | 1) {
    const target = optionIndex + direction;
    if (target < 0 || target >= question.options.length) return;
    const options = [...question.options];
    [options[optionIndex], options[target]] = [options[target], options[optionIndex]];
    update({ options });
  }

  function removeOption(optionId: string) {
    const options = question.options.filter((option) => option.id !== optionId);
    if (
      !isPuzzle &&
      !isMulti &&
      !options.some((option) => option.isCorrect) &&
      options[0]
    ) {
      options[0] = { ...options[0], isCorrect: true };
    }
    update({ options });
  }

  function addOption() {
    update({
      options: [
        ...question.options,
        { id: crypto.randomUUID(), text: "", isCorrect: false },
      ],
    });
  }

  return (
    <section
      aria-labelledby={fieldId("title")}
      className={cn(
        "rounded-2xl border bg-background/70 p-4 sm:p-5",
        issues.length > 0 ? "border-destructive/40" : "border-border/80",
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3
          id={fieldId("title")}
          className="flex items-center gap-2 font-kufam text-base text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-sm text-primary">
            {index + 1}
          </span>
          السؤال {index + 1}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`تحريك السؤال ${index + 1} لأعلى`}
            title="لأعلى"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`تحريك السؤال ${index + 1} لأسفل`}
            title="لأسفل"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`نسخ السؤال ${index + 1}`}
            title="نسخ"
            disabled={total >= GAME_LIMITS.questionsMax}
            onClick={onDuplicate}
          >
            <Copy />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`حذف السؤال ${index + 1}`}
            title="حذف"
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {issues.length > 0 && (
        <ul
          role="alert"
          className="mb-4 space-y-1 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-4">
          <SegmentedChoiceField
            legend="نوع السؤال"
            name={fieldId("type")}
            columns={3}
            value={question.type}
            onChange={(type) => onChange(changeQuestionType(question, type))}
            options={QUESTION_TYPE_ORDER.map((type) => ({
              value: type,
              label: GAME_QUESTION_TYPE_LABELS[type],
              icon: TYPE_ICONS[type],
              activeClassName: "border-primary/40 bg-primary/10 text-foreground",
            }))}
          />

          <div className="space-y-2">
            <Label htmlFor={fieldId("text")}>نص السؤال</Label>
            <Textarea
              id={fieldId("text")}
              value={question.text}
              maxLength={GAME_LIMITS.questionTextMax}
              onChange={(event) => update({ text: event.target.value })}
              placeholder="اكتب السؤال…"
              rows={2}
            />
          </div>

          <ThumbnailField
            label="صورة (اختياري)"
            imageUrl={question.mediaUrl}
            onChange={onImageFile}
            accept="image/jpeg,image/png,image/webp,image/gif"
            hint="JPEG، PNG، WebP — حتى 5 ميغابايت"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={fieldId("time")}>المدة (ثانية)</Label>
              <Input
                id={fieldId("time")}
                type="number"
                inputMode="numeric"
                min={GAME_LIMITS.timeMinSec}
                max={GAME_LIMITS.timeMaxSec}
                value={question.timeLimitSec ?? ""}
                placeholder={`افتراضي: ${settings.timePerQuestionSec}`}
                onChange={(event) =>
                  update({ timeLimitSec: parseIntOrNull(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("points")}>النقاط</Label>
              <Input
                id={fieldId("points")}
                type="number"
                inputMode="numeric"
                min={0}
                max={GAME_LIMITS.pointsMax}
                step={100}
                value={question.points}
                onChange={(event) =>
                  update({ points: parseIntOrNull(event.target.value) ?? 0 })
                }
              />
            </div>
          </div>

          {question.type === "slider" ? (
            <SliderFields
              idPrefix={fieldId("slider")}
              slider={question.slider ?? DEFAULT_SLIDER}
              onChange={(slider) => update({ slider })}
            />
          ) : (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium leading-none">
                {isPuzzle ? "العناصر" : "الخيارات"}{" "}
                <span className="text-muted-foreground">
                  {isPuzzle
                    ? "(بالترتيب الصحيح من الأعلى إلى الأسفل)"
                    : isMulti
                      ? "(حدّد كل الإجابات الصحيحة)"
                      : "(حدّد الإجابة الصحيحة)"}
                </span>
              </legend>
              <ol className="space-y-2 pt-2">
                {question.options.map((option, optionIndex) => {
                  const optionLabel = `${itemWord} ${optionIndex + 1}`;
                  return (
                    <li key={option.id} className="flex items-center gap-2">
                      <OptionShape index={optionIndex} />
                      <Input
                        aria-label={optionLabel}
                        value={option.text}
                        maxLength={GAME_LIMITS.optionTextMax}
                        readOnly={isTrueFalse}
                        onChange={(event) =>
                          updateOption(option.id, { text: event.target.value })
                        }
                        placeholder={optionLabel}
                        className={cn(isTrueFalse && "bg-muted/40")}
                      />
                      {isPuzzle ? (
                        <div className="flex shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`تحريك ${optionLabel} لأعلى`}
                            disabled={optionIndex === 0}
                            onClick={() => moveOption(optionIndex, -1)}
                          >
                            <ArrowUp />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`تحريك ${optionLabel} لأسفل`}
                            disabled={optionIndex === question.options.length - 1}
                            onClick={() => moveOption(optionIndex, 1)}
                          >
                            <ArrowDown />
                          </Button>
                        </div>
                      ) : (
                        <label
                          className={cn(
                            "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition focus-within:ring-1 focus-within:ring-ring",
                            option.isCorrect
                              ? "border-emerald-400/60 bg-emerald-50 text-emerald-900"
                              : "border-border text-muted-foreground hover:bg-muted/40",
                          )}
                        >
                          <input
                            type={isMulti ? "checkbox" : "radio"}
                            name={fieldId("correct")}
                            checked={option.isCorrect}
                            onChange={() => toggleCorrect(option.id)}
                            className="accent-emerald-600"
                            aria-label={`${optionLabel} إجابة صحيحة`}
                          />
                          صحيحة
                        </label>
                      )}
                      {canRemoveOption && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`حذف ${optionLabel}`}
                          onClick={() => removeOption(option.id)}
                        >
                          <X />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ol>
              {canAddOption && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={addOption}
                >
                  <Plus className="size-3.5" />
                  {isPuzzle ? "إضافة عنصر" : "إضافة خيار"}
                </Button>
              )}
            </fieldset>
          )}

          <div className="space-y-2">
            <Label htmlFor={fieldId("explanation")}>شرح الإجابة (اختياري)</Label>
            <Textarea
              id={fieldId("explanation")}
              value={question.explanation}
              maxLength={GAME_LIMITS.explanationMax}
              onChange={(event) => update({ explanation: event.target.value })}
              placeholder="يظهر بعد انتهاء وقت السؤال"
              rows={2}
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-56 lg:self-start">
          <GameQuestionPreview
            question={question}
            index={index}
            total={total}
            settings={settings}
          />
        </div>
      </div>
    </section>
  );
}
