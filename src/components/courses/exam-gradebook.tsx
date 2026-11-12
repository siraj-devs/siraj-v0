"use client";

import {
  gradeExamAnswer,
  publishExamGrade,
} from "@/app/actions/courses";
import { RemoteAvatar } from "@/components/remote-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EXAM_QUESTION_TYPE_LABELS,
  computeExamScorePercent,
  isAutoGradableQuestion,
  isChoiceQuestionType,
  needsManualGrade,
  type CourseEnrollmentWithMember,
  type ExamAnswerRecord,
  type ExamQuestion,
  type ExamSubmission,
} from "@/lib/course-types";
import { MEMBER_ROLE_LABELS } from "@/lib/member-role";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
  Send,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function pointsLabel(points: number) {
  if (points === 1) return "نقطة واحدة";
  if (points === 2) return "نقطتان";
  return `${points} نقاط`;
}

function pendingManualCount(
  submission: ExamSubmission,
  questions: ExamQuestion[],
) {
  return submission.answers.filter((answer) => {
    const question = questions.find((q) => q.id === answer.question_id);
    if (!question) return false;
    return needsManualGrade(question) && answer.points_awarded == null;
  }).length;
}

/** Merge saved awards with in-progress draft grades for a live total preview. */
function effectiveAnswers(
  submission: ExamSubmission,
  questions: ExamQuestion[],
  draftPoints: Record<string, string>,
): ExamAnswerRecord[] {
  return submission.answers.map((answer) => {
    const question = questions.find((q) => q.id === answer.question_id);
    if (!question || !needsManualGrade(question)) return answer;
    const draft = draftPoints[String(answer.question_id)];
    if (draft == null || draft === "") return answer;
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) return answer;
    return {
      ...answer,
      points_awarded: Math.min(question.points, Math.round(parsed * 100) / 100),
    };
  });
}

function scoreTotals(
  questions: ExamQuestion[],
  answers: ExamAnswerRecord[],
) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  let earned = 0;
  let max = 0;
  let gradedCount = 0;
  let pendingCount = 0;

  for (const answer of answers) {
    const question = byId.get(answer.question_id);
    if (!question || question.points <= 0) continue;
    max += question.points;
    if (answer.points_awarded == null) {
      pendingCount += 1;
      continue;
    }
    earned += answer.points_awarded;
    gradedCount += 1;
  }

  return {
    earned: Math.round(earned * 100) / 100,
    max: Math.round(max * 100) / 100,
    gradedCount,
    pendingCount,
    percent: computeExamScorePercent(questions, answers),
  };
}

function SubmissionCard({
  courseId,
  contentId,
  questions,
  submission,
  enrollment,
}: {
  courseId: number;
  contentId: number;
  questions: ExamQuestion[];
  submission: ExamSubmission;
  enrollment: CourseEnrollmentWithMember;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [draftPoints, setDraftPoints] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const answer of submission.answers) {
      if (answer.points_awarded != null) {
        map[String(answer.question_id)] = String(answer.points_awarded);
      }
    }
    return map;
  });

  const pendingCount = pendingManualCount(submission, questions);
  const published = Boolean(submission.graded_at);
  const canPublish = pendingCount === 0;

  const previewAnswers = useMemo(
    () => effectiveAnswers(submission, questions, draftPoints),
    [draftPoints, questions, submission],
  );
  const totals = useMemo(
    () => scoreTotals(questions, previewAnswers),
    [previewAnswers, questions],
  );
  const displayPercent =
    published && submission.score != null ? submission.score : totals.percent;

  function saveGrade(question: ExamQuestion) {
    const raw = Number(draftPoints[String(question.id)]);
    if (!Number.isFinite(raw)) {
      toast.error("أدخل درجة صالحة");
      return;
    }
    startTransition(async () => {
      const result = await gradeExamAnswer({
        course_id: courseId,
        content_id: contentId,
        enrollment_id: enrollment.id,
        question_id: question.id,
        points: raw,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حفظ الدرجة");
      router.refresh();
    });
  }

  function onPublish() {
    startTransition(async () => {
      const result = await publishExamGrade({
        course_id: courseId,
        content_id: contentId,
        enrollment_id: enrollment.id,
        feedback,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.score == null
          ? "نُشرت النتيجة"
          : `نُشرت النتيجة: ${result.score}%`,
      );
      router.refresh();
    });
  }

  return (
    <li className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
      <details className="group" open={!published && pendingCount > 0}>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-muted/40 sm:gap-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <RemoteAvatar
            src={enrollment.member.avatar}
            alt={enrollment.member.name}
            className="size-11 shrink-0 rounded-2xl object-cover"
            fallback={
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 font-kufam text-sm text-primary">
                {enrollment.member.name.trim().charAt(0) || "؟"}
              </div>
            }
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate font-kufam text-base text-foreground">
              {enrollment.member.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {MEMBER_ROLE_LABELS[enrollment.member.role]} ·{" "}
              {formatDate(submission.submitted_at)}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              published
                ? displayPercent != null && displayPercent >= 50
                  ? "bg-emerald-500/10 text-emerald-800"
                  : "bg-muted text-muted-foreground"
                : pendingCount > 0
                  ? "bg-amber-500/10 text-amber-900"
                  : "bg-sky-500/10 text-sky-900",
            )}
          >
            {displayPercent != null
              ? `${displayPercent}%`
              : published
                ? "تم التقييم"
                : pendingCount > 0
                  ? `قيد المراجعة · ${pendingCount}`
                  : "جاهز للنشر"}
            {!published && displayPercent != null && pendingCount > 0
              ? " · مؤقت"
              : ""}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-4 border-t border-border/60 bg-muted/20 p-4 sm:p-6">
          <div className="grid gap-3 rounded-2xl border border-border bg-background p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">مجموع النقاط</p>
              <p className="mt-1 font-kufam text-lg text-foreground">
                {totals.earned}
                <span className="text-sm text-muted-foreground">
                  {" "}
                  / {totals.max}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {published ? "النتيجة النهائية" : "النتيجة الحالية"}
              </p>
              <p className="mt-1 font-kufam text-lg text-foreground">
                {displayPercent == null ? "—" : `${displayPercent}%`}
                {!published && pendingCount > 0 && (
                  <span className="ms-2 text-xs font-normal text-amber-800">
                    غير مكتملة
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الأسئلة المُقيَّمة</p>
              <p className="mt-1 font-kufam text-lg text-foreground">
                {totals.gradedCount}
                {totals.pendingCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    · متبقي {totals.pendingCount}
                  </span>
                )}
              </p>
            </div>
          </div>

          <ol className="space-y-3">
            {questions.map((question, index) => {
              const answer = submission.answers.find(
                (a) => a.question_id === question.id,
              );
              const preview = previewAnswers.find(
                (a) => a.question_id === question.id,
              );
              const choice = isChoiceQuestionType(question.question_type);
              const selected = answer?.selected_option_ids ?? [];
              const answered = choice
                ? selected.length > 0
                : Boolean(answer?.answer_text?.trim());
              const auto = isAutoGradableQuestion(question);
              const awarded = preview?.points_awarded ?? null;
              const savedAwarded = answer?.points_awarded ?? null;
              const fullHit =
                awarded != null &&
                question.points > 0 &&
                awarded >= question.points - 0.001;
              const partial =
                awarded != null &&
                question.points > 0 &&
                awarded > 0 &&
                awarded < question.points - 0.001;
              const awaiting =
                needsManualGrade(question) && awarded == null;

              if (!answered) {
                return (
                  <li
                    key={question.id}
                    className="rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground"
                  >
                    <span className="me-2 font-kufam text-xs">
                      {index + 1}.
                    </span>
                    {question.question_text}
                    <span className="ms-2 text-xs">(لم يُجب — اختياري)</span>
                  </li>
                );
              }

              return (
                <li
                  key={question.id}
                  className="space-y-3 rounded-2xl border border-border/70 bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted font-kufam text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium leading-7 text-foreground">
                          {question.question_text}
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          <span className="rounded-md bg-muted px-2 py-0.5">
                            {EXAM_QUESTION_TYPE_LABELS[question.question_type]}
                          </span>
                          {question.points > 0 && (
                            <span className="rounded-md bg-muted px-2 py-0.5">
                              {pointsLabel(question.points)}
                            </span>
                          )}
                          {auto ? (
                            <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-sky-900">
                              تصحيح آلي
                            </span>
                          ) : question.points > 0 ? (
                            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-900">
                              تصحيح يدوي
                            </span>
                          ) : (
                            <span className="rounded-md bg-muted px-2 py-0.5">
                              بلا نقاط
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {question.points > 0 && (
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                          awaiting
                            ? "bg-amber-500/10 text-amber-900"
                            : fullHit
                              ? "bg-emerald-500/10 text-emerald-800"
                              : partial
                                ? "bg-amber-500/10 text-amber-900"
                                : awarded != null
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground",
                        )}
                      >
                        {awaiting ? (
                          "بانتظار الدرجة"
                        ) : (
                          <>
                            {fullHit ? (
                              <CheckCircle2 className="size-3.5" />
                            ) : awarded != null && awarded <= 0 ? (
                              <XCircle className="size-3.5" />
                            ) : null}
                            {awarded ?? "—"} / {question.points}
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {choice ? (
                    <ul className="space-y-1.5" dir="rtl">
                      {question.options.map((option) => {
                        const picked = selected.includes(option.id);
                        const isCorrect =
                          question.correct_option_ids.includes(option.id);
                        return (
                          <li
                            key={option.id}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-start text-sm",
                              picked &&
                                isCorrect &&
                                "border-emerald-500/50 bg-emerald-500/10 text-emerald-900",
                              picked &&
                                !isCorrect &&
                                auto &&
                                "border-destructive/40 bg-destructive/5 text-destructive",
                              picked &&
                                !auto &&
                                "border-primary/50 bg-primary/8",
                              !picked &&
                                isCorrect &&
                                "border-dashed border-emerald-500/30 text-emerald-800",
                              !picked &&
                                !isCorrect &&
                                "border-border/70 text-foreground/70",
                            )}
                          >
                            <span>{option.text}</span>
                            <span className="shrink-0 text-[11px]">
                              {picked && "اختيار العضو"}
                              {picked && isCorrect && " · "}
                              {isCorrect && auto && "صحيحة"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-sm leading-7 text-foreground">
                      {answer?.answer_text?.trim() || "—"}
                    </div>
                  )}

                  {!auto && question.points > 0 && (
                    <div className="flex flex-wrap items-end gap-3 border-t border-border/60 pt-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`pts-${enrollment.id}-${question.id}`}
                          className="text-xs"
                        >
                          الدرجة (0 – {question.points})
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={pending}
                            onClick={() => {
                              const current = Number(
                                draftPoints[String(question.id)] ?? 0,
                              );
                              setDraftPoints((prev) => ({
                                ...prev,
                                [String(question.id)]: String(
                                  Math.max(0, current - 0.5),
                                ),
                              }));
                            }}
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <Input
                            id={`pts-${enrollment.id}-${question.id}`}
                            type="number"
                            min={0}
                            max={question.points}
                            step={0.5}
                            value={
                              draftPoints[String(question.id)] ??
                              (awarded != null ? String(awarded) : "0")
                            }
                            onChange={(e) =>
                              setDraftPoints((prev) => ({
                                ...prev,
                                [String(question.id)]: e.target.value,
                              }))
                            }
                            className="h-8 w-20 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={pending}
                            onClick={() => {
                              const current = Number(
                                draftPoints[String(question.id)] ?? 0,
                              );
                              setDraftPoints((prev) => ({
                                ...prev,
                                [String(question.id)]: String(
                                  Math.min(question.points, current + 0.5),
                                ),
                              }));
                            }}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => saveGrade(question)}
                      >
                        حفظ الدرجة
                      </Button>
                      {savedAwarded != null && (
                        <span className="text-xs text-muted-foreground">
                          المحفوظ: {savedAwarded} / {question.points}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-xs text-muted-foreground">
                  {published ? "النتيجة المنشورة" : "ملخص قبل النشر"}
                </p>
                <p className="font-kufam text-base text-foreground">
                  {totals.earned} / {totals.max} نقطة
                  {displayPercent != null ? ` · ${displayPercent}%` : ""}
                </p>
              </div>
              {!published && (
                <span className="text-[11px] text-muted-foreground">
                  {pendingCount > 0
                    ? `يتبقى تصحيح ${pendingCount} سؤال`
                    : "جاهز للنشر للمتعلّم"}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`fb-${enrollment.id}`}>
                ملاحظة للمُتعلّم (اختياري)
              </Label>
              <Textarea
                id={`fb-${enrollment.id}`}
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="تعليق يظهر مع النتيجة…"
                className="resize-y"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                disabled={pending || !canPublish}
                onClick={onPublish}
                className="gap-2"
              >
                <Send className="size-4" />
                {published ? "إعادة نشر النتيجة" : "نشر النتيجة"}
              </Button>
              {!canPublish && (
                <p className="text-xs text-amber-800">
                  أكمل تصحيح الأسئلة اليدوية أولاً
                </p>
              )}
            </div>
          </div>
        </div>
      </details>
    </li>
  );
}

export function ExamGradebook({
  courseId,
  contentId,
  questions,
  submissions,
  enrollments,
}: {
  courseId: number;
  contentId: number;
  questions: ExamQuestion[];
  submissions: ExamSubmission[];
  enrollments: CourseEnrollmentWithMember[];
}) {
  const enrollmentById = useMemo(
    () => new Map(enrollments.map((e) => [e.id, e])),
    [enrollments],
  );

  const rows = useMemo(
    () =>
      submissions
        .map((submission) => ({
          submission,
          enrollment: enrollmentById.get(submission.enrollment_id),
        }))
        .filter(
          (
            row,
          ): row is {
            submission: ExamSubmission;
            enrollment: CourseEnrollmentWithMember;
          } => Boolean(row.enrollment),
        ),
    [enrollmentById, submissions],
  );

  const pendingReview = rows.filter(
    ({ submission }) =>
      !submission.graded_at &&
      pendingManualCount(submission, questions) > 0,
  ).length;

  const published = rows.filter((row) => row.submission.graded_at);
  const scoredPublished = published.filter(
    (row) => row.submission.score != null,
  );
  const averageScore = scoredPublished.length
    ? Math.round(
        scoredPublished.reduce(
          (sum, row) => sum + (row.submission.score ?? 0),
          0,
        ) / scoredPublished.length,
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">المُرسِلون</p>
          <p className="mt-1 font-kufam text-lg text-foreground">
            {rows.length}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">بانتظار التصحيح</p>
          <p className="mt-1 font-kufam text-lg text-foreground">
            {pendingReview}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-primary/25 bg-background/70 px-4 py-3 sm:col-span-1">
          <p className="text-xs text-muted-foreground">متوسط المنشور</p>
          <p className="mt-1 font-kufam text-lg text-foreground">
            {averageScore == null ? "—" : `${averageScore}%`}
          </p>
        </div>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map(({ submission, enrollment }) => (
            <SubmissionCard
              key={submission.enrollment_id}
              courseId={courseId}
              contentId={contentId}
              questions={questions}
              submission={submission}
              enrollment={enrollment}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-kufam text-lg text-foreground">
            لا توجد إجابات بعد
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            ستظهر هنا إجابات الأعضاء بعد إرسالهم للتقويم.
          </p>
        </div>
      )}
    </div>
  );
}
