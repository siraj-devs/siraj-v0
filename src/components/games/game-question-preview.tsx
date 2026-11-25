import {
  GAME_POINTS_MODE_LABELS,
  resolveTimeLimit,
  type GameQuestionDraft,
  type GameSettings,
} from "@/lib/games";
import { cn } from "@/lib/utils";
import { Check, Circle, Diamond, Square, Timer, Triangle } from "lucide-react";
import Image from "next/image";

export const OPTION_STYLES = [
  { tile: "bg-rose-600", icon: Triangle },
  { tile: "bg-sky-600", icon: Diamond },
  { tile: "bg-amber-500", icon: Circle },
  { tile: "bg-emerald-600", icon: Square },
] as const;

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

        <ul className="grid grid-cols-2 gap-2">
          {question.options.map((option, optionIndex) => {
            const style = OPTION_STYLES[optionIndex % OPTION_STYLES.length];
            const Icon = style.icon;
            return (
              <li
                key={option.id}
                className={cn(
                  "relative flex min-h-14 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white",
                  style.tile,
                )}
              >
                <Icon className="size-4 shrink-0 fill-white/90" aria-hidden />
                <span className="min-w-0 flex-1 break-words">
                  {option.text.trim() || "…"}
                </span>
                {option.isCorrect && (
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700"
                    title="الإجابة الصحيحة"
                  >
                    <Check className="size-3.5" />
                    <span className="sr-only">الإجابة الصحيحة</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {question.explanation.trim() && (
          <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {question.explanation}
          </p>
        )}
      </div>
    </div>
  );
}
