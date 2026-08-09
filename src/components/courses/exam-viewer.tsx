"use client";

import { submitExam } from "@/app/actions/courses";
import { ProgressRing } from "@/components/courses/course-ui";
import { Button } from "@/components/ui/button";
import type { ExamQuestion } from "@/lib/course-types";
import { HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type LearnerQuestion = Omit<ExamQuestion, "correct_option_id">;

export function ExamViewer({
  title,
  courseId,
  contentId,
  questions,
}: {
  title: string;
  courseId: number;
  contentId: number;
  questions: LearnerQuestion[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  const answeredCount = questions.filter(
    (q) => answers[String(q.id)] !== undefined,
  ).length;

  function onSubmit() {
    if (questions.some((q) => !answers[String(q.id)])) {
      toast.error("أجب عن جميع الأسئلة قبل الإرسال");
      return;
    }

    startTransition(async () => {
      const res = await submitExam(courseId, contentId, answers);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setResult({ score: res.score, passed: res.passed });
      toast.success(
        res.passed
          ? `نجحت بنسبة ${res.score}%`
          : `نتيجتك ${res.score}% — حاول مجدداً`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-primary/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="size-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-kufam text-xl text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {questions.length} أسئلة
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          أجبت عن {answeredCount} من {questions.length}
        </p>
      </div>

      {result && (
        <div
          className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${
            result.passed
              ? "border-primary/40 bg-primary/8"
              : "border-border bg-muted/60"
          }`}
        >
          <ProgressRing value={result.score} size={56} />
          <div>
            <p className="font-kufam text-base text-foreground">
              {result.passed ? "أحسنت، نتيجة ناجحة" : "لم تكتمل بعد"}
            </p>
            <p className="text-sm text-muted-foreground">
              نتيجتك {result.score}%
            </p>
          </div>
        </div>
      )}

      <ol className="space-y-4">
        {questions.map((question, index) => {
          const selected = answers[String(question.id)];
          return (
            <li
              key={question.id}
              className="rounded-2xl border border-border/70 bg-background/70 p-5 shadow-[0_4px_24px_-20px_color-mix(in_oklch,var(--foreground)_15%,transparent)]"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-kufam text-xs text-primary">
                    {index + 1}
                  </span>
                  <p className="font-medium leading-7 text-foreground">
                    {question.question_text}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                  درجة واحدة
                </span>
              </div>

              <fieldset className="space-y-2.5">
                <legend className="sr-only">خيارات السؤال {index + 1}</legend>
                {question.options.map((option) => {
                  const active = selected === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                        active
                          ? "border-primary/50 bg-primary/8 text-foreground"
                          : "border-border/70 text-foreground/80 hover:border-primary/30 hover:bg-primary/4"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        className="size-4 accent-primary"
                        checked={active}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [String(question.id)]: option.id,
                          }))
                        }
                      />
                      <span className="leading-7">{option.text}</span>
                    </label>
                  );
                })}
              </fieldset>
            </li>
          );
        })}
      </ol>

      <Button
        onClick={onSubmit}
        disabled={pending || questions.length === 0}
        className="w-full sm:w-auto"
      >
        {pending ? "جاري التصحيح…" : "إرسال الإجابات"}
      </Button>
    </div>
  );
}
