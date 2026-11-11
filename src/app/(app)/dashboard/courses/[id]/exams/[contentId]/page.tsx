import { RemoteAvatar } from "@/components/remote-avatar";
import {
  getCourseById,
  getCourseContentById,
  getCourseEnrollments,
  getExamQuestions,
  getExamSubmissions,
} from "@/lib/courses";
import {
  EXAM_QUESTION_TYPE_LABELS,
  isChoiceQuestionType,
  type ExamQuestion,
  type ExamSubmission,
} from "@/lib/course-types";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { MEMBER_ROLE_LABELS } from "@/lib/member-role";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((item) => set.has(item));
}

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
  if (points === 0) return "بدون نقاط";
  if (points === 1) return "نقطة";
  if (points === 2) return "نقطتان";
  return `${points} نقاط`;
}

function QuestionAnswer({
  question,
  index,
  submission,
}: {
  question: ExamQuestion;
  index: number;
  submission: ExamSubmission;
}) {
  const answer = submission.answers.find((a) => a.question_id === question.id);
  const choice = isChoiceQuestionType(question.question_type);
  const selected = answer?.selected_option_ids ?? [];
  const answered = choice
    ? selected.length > 0
    : Boolean(answer?.answer_text?.trim());
  const gradable = choice && question.correct_option_ids.length > 0;
  const correct = gradable && sameSet(selected, question.correct_option_ids);

  return (
    <li className="space-y-3 rounded-2xl border border-border/70 bg-background p-4">
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
              <span className="rounded-md bg-muted px-2 py-0.5">
                {pointsLabel(question.points)}
              </span>
              {question.is_optional && (
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-900">
                  اختياري
                </span>
              )}
            </div>
          </div>
        </div>
        {gradable && answered && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
              correct
                ? "bg-emerald-500/10 text-emerald-800"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {correct ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <XCircle className="size-3.5" />
            )}
            {correct ? "صحيحة" : "خاطئة"}
          </span>
        )}
        {!answered && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
            لم يُجب
          </span>
        )}
      </div>

      {choice ? (
        <ul className="space-y-1.5">
          {question.options.map((option) => {
            const picked = selected.includes(option.id);
            const isCorrect = question.correct_option_ids.includes(option.id);
            return (
              <li
                key={option.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm",
                  picked && isCorrect &&
                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-900",
                  picked && !isCorrect && gradable &&
                    "border-destructive/40 bg-destructive/5 text-destructive",
                  picked && !gradable && "border-primary/50 bg-primary/8",
                  !picked && isCorrect &&
                    "border-emerald-500/30 border-dashed text-emerald-800",
                  !picked && !isCorrect && "border-border/70 text-foreground/70",
                )}
              >
                <span>{option.text}</span>
                <span className="shrink-0 text-[11px]">
                  {picked && "اختيار العضو"}
                  {picked && isCorrect && " · "}
                  {isCorrect && "الإجابة الصحيحة"}
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
    </li>
  );
}

export default async function ExamAnswersPage({
  params,
}: {
  params: Promise<{ id: string; contentId: string }>;
}) {
  const { canEdit } = await gateDashboardPage("/dashboard/courses");
  if (!canEdit) redirect("/dashboard/courses");

  const { id: rawId, contentId: rawContent } = await params;
  const courseId = Number(rawId);
  const contentId = Number(rawContent);
  if (!Number.isFinite(courseId) || !Number.isFinite(contentId)) notFound();

  const [course, content] = await Promise.all([
    getCourseById(courseId),
    getCourseContentById(contentId),
  ]);
  if (
    !course ||
    !content ||
    content.course_id !== courseId ||
    content.type !== "exam"
  ) {
    notFound();
  }

  const [questions, submissions, enrollments] = await Promise.all([
    getExamQuestions(contentId),
    getExamSubmissions(contentId),
    getCourseEnrollments(courseId),
  ]);

  const enrollmentById = new Map(enrollments.map((e) => [e.id, e]));
  const rows = submissions
    .map((submission) => ({
      submission,
      enrollment: enrollmentById.get(submission.enrollment_id),
    }))
    .filter(
      (row): row is typeof row & {
        enrollment: NonNullable<typeof row.enrollment>;
      } => Boolean(row.enrollment),
    );

  const scored = rows.filter((row) => row.submission.score != null);
  const average = scored.length
    ? Math.round(
        scored.reduce((sum, row) => sum + (row.submission.score ?? 0), 0) /
          scored.length,
      )
    : null;

  const classEnrollments = enrollments.filter(
    (e) => e.class_id === content.class_id,
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-6 pb-16 md:py-10">
      <div className="space-y-4">
        <Link
          href={`/dashboard/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          {course.title}
        </Link>
        <header className="rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-7 md:px-8">
          <p className="text-xs font-medium text-primary">إجابات التقويم</p>
          <h1 className="mt-1 font-kufam text-3xl font-semibold text-foreground">
            {content.title}
          </h1>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                المُرسِلون
              </p>
              <p className="mt-1 font-kufam text-lg text-foreground">
                {rows.length}
                {classEnrollments.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    / {classEnrollments.length}
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3">
              <p className="text-xs text-muted-foreground">عدد الأسئلة</p>
              <p className="mt-1 font-kufam text-lg text-foreground">
                {questions.length}
              </p>
            </div>
            <div className="col-span-2 rounded-2xl border border-primary/25 bg-background/70 px-4 py-3 sm:col-span-1">
              <p className="text-xs text-muted-foreground">متوسط التصحيح الآلي</p>
              <p className="mt-1 font-kufam text-lg text-foreground">
                {average == null ? "—" : `${average}%`}
              </p>
            </div>
          </div>
        </header>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map(({ submission, enrollment }) => (
            <li
              key={submission.enrollment_id}
              className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm"
            >
              <details className="group">
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
                      submission.score == null
                        ? "bg-muted text-muted-foreground"
                        : submission.score >= 50
                          ? "bg-emerald-500/10 text-emerald-800"
                          : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {submission.score == null
                      ? "بدون تصحيح آلي"
                      : `${submission.score}%`}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <ol className="space-y-3 border-t border-border/60 bg-muted/20 p-4 sm:p-6">
                  {questions.map((question, index) => (
                    <QuestionAnswer
                      key={question.id}
                      question={question}
                      index={index}
                      submission={submission}
                    />
                  ))}
                </ol>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <Users className="mx-auto mb-3 size-8 text-muted-foreground/40" />
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
