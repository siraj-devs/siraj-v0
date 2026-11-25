import {
  DEFAULT_SLIDER,
  GAME_POINTS_MODE_LABELS,
  GAME_QUESTION_TYPE_HINTS,
  resolveTimeLimit,
  type GameQuestionDraft,
  type GameSettings,
} from "@/lib/games";
import { cn } from "@/lib/utils";
import {
  Check,
  Circle,
  Diamond,
  Hexagon,
  Square,
  Star,
  Timer,
  Triangle,
} from "lucide-react";
import Image from "next/image";

export const OPTION_STYLES = [
  { tile: "bg-rose-600", icon: Triangle },
  { tile: "bg-sky-600", icon: Diamond },
  { tile: "bg-amber-500", icon: Circle },
  { tile: "bg-emerald-600", icon: Square },
  { tile: "bg-violet-600", icon: Hexagon },
  { tile: "bg-orange-600", icon: Star },
] as const;

function SliderPreview({ question }: { question: GameQuestionDraft }) {
  const slider = question.slider ?? DEFAULT_SLIDER;
  const range = slider.max - slider.min;
  const percent = (value: number) =>
    range > 0 ? Math.min(100, Math.max(0, ((value - slider.min) / range) * 100)) : 0;
  const unit = slider.unit.trim();
  const lowEdge = percent(slider.correctValue - slider.tolerance);
  const highEdge = percent(slider.correctValue + slider.tolerance);

  return (
    <div className="space-y-3 rounded-xl bg-background px-4 py-5 shadow-sm" dir="ltr">
      <p className="text-center font-kufam text-2xl text-foreground">
        {slider.correctValue}
        {unit && <span className="ms-1 text-base text-muted-foreground">{unit}</span>}
      </p>
      <div className="relative h-2 rounded-full bg-muted">
        {slider.tolerance > 0 && (
          <span
            className="absolute inset-y-0 rounded-full bg-emerald-200"
            style={{ left: `${lowEdge}%`, width: `${highEdge - lowEdge}%` }}
          />
        )}
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-emerald-600 shadow"
          style={{ left: `${percent(slider.correctValue)}%` }}
          title="الإجابة الصحيحة"
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{slider.min}</span>
        {slider.tolerance > 0 && <span dir="rtl">± {slider.tolerance} مقبول</span>}
        <span>{slider.max}</span>
      </div>
    </div>
  );
}

function OptionTile({
  index,
  text,
  correct,
  numbered,
}: {
  index: number;
  text: string;
  correct?: boolean;
  numbered?: boolean;
}) {
  const style = OPTION_STYLES[index % OPTION_STYLES.length];
  const Icon = style.icon;
  return (
    <li
      className={cn(
        "relative flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white",
        style.tile,
      )}
    >
      {numbered ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs">
          {index + 1}
        </span>
      ) : (
        <Icon className="size-4 shrink-0 fill-white/90" aria-hidden />
      )}
      <span className="min-w-0 flex-1 break-words">{text.trim() || "…"}</span>
      {correct && (
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700"
          title="إجابة صحيحة"
        >
          <Check className="size-3.5" />
          <span className="sr-only">إجابة صحيحة</span>
        </span>
      )}
    </li>
  );
}

/** Approximation of what players see on the play app for one question. */
export function GameQuestionPreview({
  question,
  index,
  total,
  settings,
}: {
  question: GameQuestionDraft;
  index: number;
  total: number;
  settings: GameSettings;
}) {
  return (
    <div
      aria-label="معاينة السؤال"
      className="overflow-hidden rounded-2xl border border-border bg-foreground/[0.03]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-2 text-xs text-muted-foreground">
        <span>
          السؤال {index + 1} من {total}
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Timer className="size-3.5" />
            {resolveTimeLimit(question, settings)} ث
          </span>
          <span>
            {settings.pointsMode === "none"
              ? GAME_POINTS_MODE_LABELS.none
              : `${question.points} نقطة`}
          </span>
        </span>
      </div>

      <div className="space-y-4 p-4">
        <p className="min-h-12 rounded-xl bg-background px-4 py-3 text-center font-kufam text-lg text-foreground shadow-sm">
          {question.text.trim() || (
            <span className="text-muted-foreground">نص السؤال…</span>
          )}
        </p>

        {question.mediaUrl && (
          <div className="relative mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-xl">
            <Image
              src={question.mediaUrl}
              alt=""
              fill
              className="object-cover"
              sizes="384px"
            />
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {GAME_QUESTION_TYPE_HINTS[question.type]}
        </p>

        {question.type === "slider" ? (
          <SliderPreview question={question} />
        ) : question.type === "puzzle" ? (
          <>
            <ol className="grid gap-2" aria-label="الترتيب الصحيح">
              {question.options.map((option, optionIndex) => (
                <OptionTile
                  key={option.id}
                  index={optionIndex}
                  text={option.text}
                  numbered
                />
              ))}
            </ol>
            <p className="text-center text-xs text-muted-foreground">
              يظهر هذا الترتيب الصحيح هنا فقط؛ يرى اللاعبون العناصر مخلوطة.
            </p>
          </>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {question.options.map((option, optionIndex) => (
              <OptionTile
                key={option.id}
                index={optionIndex}
                text={option.text}
                correct={option.isCorrect}
              />
            ))}
          </ul>
        )}

        {question.explanation.trim() && (
          <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {question.explanation}
          </p>
        )}
      </div>
    </div>
  );
}
