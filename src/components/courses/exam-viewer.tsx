"use client";

import { submitExam, type ExamAnswerPayload } from "@/app/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { LearnerExamQuestion } from "@/lib/courses";
import {
  EXAM_QUESTION_TYPE_LABELS,
  isChoiceQuestionType,
  type ExamSubmission,
} from "@/lib/course-types";
import { filterArabicInput } from "@/lib/profile-fields";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

function isAnswered(question: LearnerExamQuestion, answer?: ExamAnswerPayload) {
  if (!answer) return false;
  if (isChoiceQuestionType(question.question_type)) {
    return (answer.selected_option_ids?.length ?? 0) > 0;
  }
  return Boolean(answer.answer_text?.trim());
}

function pointsLabel(points: number) {
  if (points === 0) return "بدون نقاط";
  if (points === 1) return "نقطة واحدة";
  if (points === 2) return "نقطتان";
  if (points >= 3 && points <= 10) return `${points} نقاط`;
  return `${points} نقطة`;
}

function formatSubmittedAt(value: string) {
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function answersFromSubmission(
  submission: ExamSubmission | null,
): Record<string, ExamAnswerPayload> {
  const map: Record<string, ExamAnswerPayload> = {};
  if (!submission) return map;
  for (const answer of submission.answers) {
    map[String(answer.question_id)] = {
      selected_option_ids: answer.selected_option_ids,
      answer_text: answer.answer_text ?? undefined,
    };
  }
  return map;
}

export function ExamViewer({
  title,
  courseId,
  contentId,
  questions,
  submission,
}: {
  title: string;
  courseId: number;
  contentId: number;
  questions: LearnerExamQuestion[];
  submission: ExamSubmission | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Record<string, ExamAnswerPayload>>(
    () => answersFromSubmission(submission),
  );
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const readOnly = Boolean(submission) || justSubmitted;

  const requiredQuestions = useMemo(
    () => questions.filter((q) => !q.is_optional),
    [questions],
  );
  const answeredRequiredCount = useMemo(
    () =>
      requiredQuestions.filter((q) => isAnswered(q, answers[String(q.id)]))
        .length,
    [answers, requiredQuestions],
  );
  const allRequiredAnswered =
    requiredQuestions.length === 0 ||
    answeredRequiredCount === requiredQuestions.length;

  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + q.points, 0),
    [questions],
  );
  const progressPercent = requiredQuestions.length
    ? (answeredRequiredCount / requiredQuestions.length) * 100
    : 100;

  function setChoice(question: LearnerExamQuestion, optionId: string) {
    if (readOnly) return;
    const key = String(question.id);
    setAnswers((prev) => {
      const current = prev[key]?.selected_option_ids ?? [];
      if (question.allow_multiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [key]: { selected_option_ids: next } };
      }
      return { ...prev, [key]: { selected_option_ids: [optionId] } };
    });
  }

  function setText(questionId: number, value: string) {
    if (readOnly) return;
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: { answer_text: filterArabicInput(value) },
    }));
  }

  function onSubmit() {
    if (!allRequiredAnswered) {
      toast.error("أجب عن جميع الأسئلة المطلوبة قبل الإرسال");
      return;
    }

    startTransition(async () => {
      const res = await submitExam(courseId, contentId, answers);
      if (!res.success) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      setJustSubmitted(true);
      setConfirming(false);
      toast.success("تم إرسال إجاباتك بنجاح");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
        <div className="relative flex flex-wrap items-center justify-between gap-5 bg-linear-to-b from-primary/10 to-primary/3 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <ClipboardCheck className="size-6" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-primary">تقويم</p>
              <h2 className="font-kufam text-2xl font-semibold leading-tight text-foreground">
                {title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-background/80 px-2.5 py-1 ring-1 ring-border">
                  {questions.length} أسئلة
                </span>
                {totalPoints > 0 && (
                  <span className="rounded-full bg-background/80 px-2.5 py-1 ring-1 ring-border">
                    {pointsLabel(totalPoints)}
                  </span>
                )}
                {requiredQuestions.length < questions.length && (
                  <span className="rounded-full bg-background/80 px-2.5 py-1 ring-1 ring-border">
                    {questions.length - requiredQuestions.length} اختيارية
                  </span>
                )}
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="w-full space-y-2 sm:w-52">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>الأسئلة المطلوبة</span>
                <span className="font-kufam text-foreground">
                  {answeredRequiredCount} / {requiredQuestions.length}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border/70">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submitted banner */}
      {readOnly && (
        <div className="flex items-start gap-4 rounded-3xl border border-primary/30 bg-primary/5 px-5 py-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-kufam text-base text-foreground">
              تم إرسال إجاباتك
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              سيتم تقييم إجاباتك لاحقاً. لا يمكن تعديلها أو إعادة الإرسال.
              {submission && (
                <span className="block text-xs">
                  أُرسلت في {formatSubmittedAt(submission.submitted_at)}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Questions */}
      <ol className="space-y-5">
        {questions.map((question, index) => {
          const answer = answers[String(question.id)];
          const selected = answer?.selected_option_ids ?? [];
          const multi = question.allow_multiple;
          const done = isAnswered(question, answer);
          const skipped = readOnly && !done;

          return (
            <li
              key={question.id}
              className={cn(
                "rounded-3xl border bg-background p-5 shadow-sm transition-colors sm:p-6",
                done && !readOnly ? "border-primary/30" : "border-border/70",
                skipped && "opacity-70",
              )}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl font-kufam text-sm transition-colors",
                      done
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-2">
                    <p
                      dir="rtl"
                      className="text-start text-base font-medium leading-8 text-foreground"
                    >
                      {question.question_text}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                        {EXAM_QUESTION_TYPE_LABELS[question.question_type]}
                      </span>
                      {question.allow_multiple && (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          اختر أكثر من إجابة
                        </span>
                      )}
                      {question.is_optional && (
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-900">
                          اختياري
                        </span>
                      )}
                      {skipped && (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          لم تُجب
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {question.points > 0 && (
                  <span className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
                    {pointsLabel(question.points)}
                  </span>
                )}
              </div>

              {isChoiceQuestionType(question.question_type) &&
                (multi ? (
                  <div className="space-y-2.5">
                    {question.options.map((option) => {
                      const active = selected.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm transition-all",
                            readOnly ? "cursor-default" : "cursor-pointer",
                            active
                              ? "border-primary/60 bg-primary/8 text-foreground shadow-sm"
                              : "border-border/80 text-foreground/80",
                            !active &&
                              !readOnly &&
                              "hover:border-primary/30 hover:bg-muted/40",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-4 shrink-0 accent-primary"
                            checked={active}
                            disabled={readOnly}
                            onChange={() => setChoice(question, option.id)}
                          />
                          <span
                            dir="rtl"
                            className="flex-1 text-start leading-7"
                          >
                            {option.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <RadioGroup
                    value={selected[0] ?? ""}
                    onValueChange={(value) => setChoice(question, value)}
                    disabled={readOnly}
                    className="gap-2.5"
                    dir="rtl"
                  >
                    {question.options.map((option) => {
                      const active = selected[0] === option.id;
                      const id = `q-${question.id}-${option.id}`;
                      return (
                        <label
                          key={option.id}
                          htmlFor={id}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm transition-all",
                            readOnly ? "cursor-default" : "cursor-pointer",
                            active
                              ? "border-primary/60 bg-primary/8 text-foreground shadow-sm"
                              : "border-border/80 text-foreground/80",
                            !active &&
                              !readOnly &&
                              "hover:border-primary/30 hover:bg-muted/40",
                          )}
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={id}
                            className="shrink-0"
                          />
                          <span
                            dir="rtl"
                            className="flex-1 text-start leading-7"
                          >
                            {option.text}
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                ))}

              {question.question_type === "short_text" && (
                <div className="space-y-2">
                  <Label htmlFor={`short-${question.id}`} className="sr-only">
                    الإجابة
                  </Label>
                  <Input
                    id={`short-${question.id}`}
                    dir="rtl"
                    lang="ar"
                    value={answer?.answer_text ?? ""}
                    readOnly={readOnly}
                    onChange={(e) => setText(question.id, e.target.value)}
                    placeholder={readOnly ? "—" : "اكتب إجابتك هنا"}
                    className="h-11 rounded-2xl text-start"
                  />
                </div>
              )}

              {question.question_type === "long_text" && (
                <div className="space-y-2">
                  <Label htmlFor={`long-${question.id}`} className="sr-only">
                    الإجابة
                  </Label>
                  <Textarea
                    id={`long-${question.id}`}
                    dir="rtl"
                    lang="ar"
                    rows={5}
                    value={answer?.answer_text ?? ""}
                    readOnly={readOnly}
                    onChange={(e) => setText(question.id, e.target.value)}
                    placeholder={readOnly ? "—" : "اكتب إجابتك هنا"}
                    className="min-h-32 resize-y rounded-2xl text-start leading-7"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Submit */}
      {readOnly ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          أُغلق هذا التقويم بعد الإرسال
        </div>
      ) : confirming ? (
        <div className="space-y-4 rounded-3xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div className="space-y-1">
              <p className="font-kufam text-base text-foreground">
                تأكيد الإرسال
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                يمكنك إرسال إجاباتك مرة واحدة فقط، ولا يمكن تعديلها بعد ذلك.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={onSubmit} disabled={pending} className="sm:min-w-40">
              {pending ? "جاري الإرسال…" : "نعم، أرسل الإجابات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              مراجعة الإجابات
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={() => setConfirming(true)}
            disabled={questions.length === 0 || !allRequiredAnswered}
            className="w-full sm:w-auto sm:min-w-44"
          >
            إرسال الإجابات
          </Button>
          {!allRequiredAnswered && (
            <p className="text-xs text-muted-foreground">
              أجب عن جميع الأسئلة المطلوبة لتفعيل الإرسال
            </p>
          )}
        </div>
      )}
    </div>
  );
}
