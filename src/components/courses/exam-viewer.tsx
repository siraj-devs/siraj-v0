"use client";

import { submitExam } from "@/app/actions/courses";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ExamQuestion } from "@/lib/course-types";
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
      <h2 className="font-kufam text-xl text-foreground">{title}</h2>

      {result && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            result.passed
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-border bg-muted text-foreground"
          }`}
        >
          النتيجة: {result.score}% — {result.passed ? "ناجح" : "غير مكتمل"}
        </div>
      )}

      <ol className="space-y-5">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="space-y-3 rounded-2xl border border-border bg-background/80 p-4 sm:p-5"
          >
            <p className="font-medium text-foreground">
              {index + 1}. {question.question_text}
            </p>
            <fieldset className="space-y-2">
              <legend className="sr-only">خيارات السؤال {index + 1}</legend>
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                    answers[String(question.id)] === option.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    className="accent-primary"
                    checked={answers[String(question.id)] === option.id}
                    onChange={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [String(question.id)]: option.id,
                      }))
                    }
                  />
                  <Label className="cursor-pointer font-normal">
                    {option.text}
                  </Label>
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ol>

      <Button onClick={onSubmit} disabled={pending || questions.length === 0}>
        {pending ? "جاري التصحيح…" : "إرسال الإجابات"}
      </Button>
    </div>
  );
}
