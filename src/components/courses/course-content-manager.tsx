"use client";

import {
  deleteCourseContent,
  deleteExamQuestion,
  reorderCourseContents,
  reorderExamQuestions,
  upsertCourseContent,
  upsertExamQuestion,
} from "@/app/actions/courses";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { AudioViewer } from "@/components/courses/audio-viewer";
import { CourseClassesPanel } from "@/components/courses/course-classes-panel";
import { ExamQuestionsDialog } from "@/components/courses/exam-questions-dialog";
import { FormDialog } from "@/components/dashboard/form-dialog";
import { ListRowActions } from "@/components/dashboard/list-row-actions";
import type { KebabMenuItem } from "@/components/dashboard/kebab-menu";
import {
  CONTENT_TYPE_HINT,
  CONTENT_TYPE_ICON,
  MetaChip,
  StarRating,
} from "@/components/courses/course-ui";
import { ReadingViewer } from "@/components/courses/reading-viewer";
import { VideoViewer } from "@/components/courses/video-viewer";
import { Rosette } from "@/components/islamic-motif";
import { RemoteAvatar } from "@/components/remote-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  formatClassDate,
  formatLessonDateRange,
  formatLessonDuration,
  formatRegistrationWindow,
  isClassOpen,
} from "@/lib/course-schedule";
import type { CourseClass, DurationUnit } from "@/lib/course-schedule";
import type {
  CourseContent,
  CourseContentType,
  CourseEnrollmentWithMember,
  CourseWithMeta,
  ExamOption,
  ExamQuestion,
  ExamQuestionType,
  VideoTimestamp,
} from "@/lib/course-types";
import {
  CONTENT_TYPE_LABELS,
  EXAM_QUESTION_TYPE_LABELS,
  VISIBILITY_LABELS,
  isChoiceQuestionType,
  isTextQuestionType,
} from "@/lib/course-types";
import {
  MEMBER_ROLE_LABELS,
  type MemberRole,
} from "@/lib/member-role";
import {
  CalendarDays,
  Clock,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Eye,
  EyeOff,
  Globe,
  Book,
  GripVertical,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import { toast } from "sonner";

const REQUIRED_MARK =
  "after:ms-0.5 after:text-destructive after:content-['*']";

const ROLE_STYLES: Record<MemberRole, string> = {
  owner: "bg-rose-500/10 text-rose-800 ring-rose-500/20",
  admin: "bg-primary/15 text-[#7a5a08] ring-primary/25",
  participant: "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20",
  veteran: "bg-sky-500/10 text-sky-800 ring-sky-500/20",
  newcomer: "bg-violet-500/10 text-violet-800 ring-violet-500/20",
};

export function CourseContentManager({
  course,
  contents,
  questionsByContent,
  enrollments = [],
  ratingsByMember = {},
  classes = [],
}: {
  course: CourseWithMeta;
  contents: CourseContent[];
  questionsByContent: Record<number, ExamQuestion[]>;
  enrollments?: CourseEnrollmentWithMember[];
  ratingsByMember?: Record<number, number>;
  classes?: CourseClass[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CourseContent | null>(null);
  const [deleting, setDeleting] = useState<CourseContent | null>(null);
  const [previewing, setPreviewing] = useState<CourseContent | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [type, setType] = useState<CourseContentType>("watching");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [timestampsText, setTimestampsText] = useState("");
  const [durationAmount, setDurationAmount] = useState("");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    classes[classes.length - 1]?.id ?? null,
  );

  const [examState, setExamState] = useState<{
    contentId: number;
    question: ExamQuestion | null;
  } | null>(null);
  const [deletingQuestion, setDeletingQuestion] =
    useState<ExamQuestion | null>(null);
  const [localQuestionsByContent, setLocalQuestionsByContent] = useState(
    questionsByContent,
  );
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(
    null,
  );
  const [dragOverQuestionId, setDragOverQuestionId] = useState<number | null>(
    null,
  );
  const [localContents, setLocalContents] = useState(contents);
  const [draggingLessonId, setDraggingLessonId] = useState<number | null>(null);
  const [dragOverLessonId, setDragOverLessonId] = useState<number | null>(null);

  useEffect(() => {
    setLocalQuestionsByContent(questionsByContent);
  }, [questionsByContent]);

  useEffect(() => {
    setLocalContents(contents);
  }, [contents]);

  useEffect(() => {
    if (
      selectedClassId != null &&
      classes.some((item) => item.id === selectedClassId)
    ) {
      return;
    }
    setSelectedClassId(classes[classes.length - 1]?.id ?? null);
  }, [classes, selectedClassId]);

  const classContents = useMemo(
    () => localContents.filter((item) => item.class_id === selectedClassId),
    [localContents, selectedClassId],
  );
  const selectedClass =
    classes.find((item) => item.id === selectedClassId) ?? null;
  const selectedClassNumber =
    classes.findIndex((item) => item.id === selectedClassId) + 1;

  const classEnrollments = useMemo(
    () => enrollments.filter((item) => item.class_id === selectedClassId),
    [enrollments, selectedClassId],
  );

  const completedCount = useMemo(
    () =>
      classEnrollments.filter(
        (item) =>
          item.status === "completed" || item.progress_percentage >= 100,
      ).length,
    [classEnrollments],
  );

  const classSummaries = useMemo(() => {
    const map: Record<
      number,
      { lessons: number; exams: number; participants: number }
    > = {};
    for (const courseClass of classes) {
      map[courseClass.id] = { lessons: 0, exams: 0, participants: 0 };
    }
    for (const content of contents) {
      if (content.class_id == null || !map[content.class_id]) continue;
      if (content.type === "exam") map[content.class_id].exams += 1;
      else map[content.class_id].lessons += 1;
    }
    for (const enrollment of enrollments) {
      if (enrollment.class_id == null || !map[enrollment.class_id]) continue;
      map[enrollment.class_id].participants += 1;
    }
    return map;
  }, [classes, contents, enrollments]);

  const examTitle = useMemo(
    () =>
      contents.find((item) => item.id === examState?.contentId)?.title ?? null,
    [contents, examState],
  );

  function openQuestionDialog(
    contentId: number,
    question: ExamQuestion | null = null,
  ) {
    setOpenMenuId(null);
    setExamState({ contentId, question });
  }

  function onDeleteQuestion() {
    if (!deletingQuestion) return;
    startTransition(async () => {
      const result = await deleteExamQuestion(deletingQuestion.id, course.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف السؤال");
      setDeletingQuestion(null);
      router.refresh();
    });
  }

  function onQuestionDragStart(questionId: number) {
    setDraggingQuestionId(questionId);
  }

  function onQuestionDragOver(
    event: DragEvent<HTMLLIElement>,
    questionId: number,
  ) {
    event.preventDefault();
    if (dragOverQuestionId !== questionId) {
      setDragOverQuestionId(questionId);
    }
  }

  function onQuestionDragEnd() {
    setDraggingQuestionId(null);
    setDragOverQuestionId(null);
  }

  function onQuestionDrop(
    event: DragEvent<HTMLLIElement>,
    contentId: number,
    targetQuestionId: number,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = draggingQuestionId;
    setDraggingQuestionId(null);
    setDragOverQuestionId(null);
    if (sourceId == null || sourceId === targetQuestionId) return;

    const current = localQuestionsByContent[contentId] ?? [];
    const fromIndex = current.findIndex((item) => item.id === sourceId);
    const toIndex = current.findIndex((item) => item.id === targetQuestionId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setLocalQuestionsByContent((prev) => ({ ...prev, [contentId]: next }));

    startTransition(async () => {
      const result = await reorderExamQuestions({
        course_id: course.id,
        content_id: contentId,
        ordered_ids: next.map((item) => item.id),
      });
      if (!result.success) {
        toast.error(result.error);
        setLocalQuestionsByContent(questionsByContent);
        return;
      }
      router.refresh();
    });
  }

  function onLessonDragStart(lessonId: number) {
    setDraggingLessonId(lessonId);
    setDraggingQuestionId(null);
    setDragOverQuestionId(null);
  }

  function onLessonDragOver(
    event: DragEvent<HTMLLIElement>,
    lessonId: number,
  ) {
    if (draggingLessonId == null) return;
    event.preventDefault();
    if (dragOverLessonId !== lessonId) {
      setDragOverLessonId(lessonId);
    }
  }

  function onLessonDragEnd() {
    setDraggingLessonId(null);
    setDragOverLessonId(null);
  }

  function onLessonDrop(targetLessonId: number) {
    const sourceId = draggingLessonId;
    const classId = selectedClassId;
    setDraggingLessonId(null);
    setDragOverLessonId(null);
    if (sourceId == null || sourceId === targetLessonId || classId == null) {
      return;
    }

    const current = localContents.filter((item) => item.class_id === classId);
    const fromIndex = current.findIndex((item) => item.id === sourceId);
    const toIndex = current.findIndex((item) => item.id === targetLessonId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setLocalContents((prev) => {
      const others = prev.filter((item) => item.class_id !== classId);
      return [...others, ...next];
    });

    startTransition(async () => {
      const result = await reorderCourseContents({
        course_id: course.id,
        class_id: classId,
        ordered_ids: next.map((item) => item.id),
      });
      if (!result.success) {
        toast.error(result.error);
        setLocalContents(contents);
        return;
      }
      router.refresh();
    });
  }

  useEffect(() => {
    if (!previewing && !examState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (previewing) setPreviewing(null);
      if (examState && !pending) setExamState(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewing, examState, pending]);

  function openCreate() {
    setEditing(null);
    setType("watching");
    setTitle("");
    setAuthor("");
    setContentUrl("");
    setTimestampsText("");
    setDurationAmount("");
    setDurationUnit("days");
    setStartDate("");
    setEndDate("");
    setModal(true);
  }

  function openEdit(content: CourseContent) {
    setEditing(content);
    setType(content.type);
    setTitle(content.title);
    setAuthor(content.author ?? "");
    setContentUrl(content.content_url ?? "");
    setTimestampsText(
      (content.metadata.timestamps ?? [])
        .map((t) => `${t.seconds}|${t.label}`)
        .join("\n"),
    );
    setDurationAmount(
      content.duration_amount ? String(content.duration_amount) : "",
    );
    setDurationUnit(content.duration_unit ?? "days");
    setStartDate(content.start_date ?? "");
    setEndDate(content.end_date ?? "");
    setModal(true);
  }

  function parseTimestamps(text: string): VideoTimestamp[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        const [secondsRaw, ...rest] = line.split("|");
        const seconds = Number(secondsRaw);
        const label = rest.join("|").trim();
        if (!Number.isFinite(seconds) || !label) return [];
        return [{ seconds, label }];
      });
  }

  function onSubmitContent(event: FormEvent) {
    event.preventDefault();
    if (!editing && selectedClassId == null) {
      toast.error("افتح دفعة أولاً ثم أضف دروسها");
      return;
    }
    startTransition(async () => {
      const trimmedDuration = durationAmount.trim();
      let duration_unit: DurationUnit | null = null;
      let duration_amount: number | null = null;
      if (trimmedDuration) {
        const amount = Number(trimmedDuration);
        if (!Number.isInteger(amount) || amount < 1) {
          toast.error("أدخل مدة صحيحة بالأيام أو الساعات");
          return;
        }
        duration_unit = durationUnit;
        duration_amount = amount;
      }

      const result = await upsertCourseContent({
        id: editing?.id,
        course_id: course.id,
        type,
        title,
        author: type === "exam" ? null : author,
        content_url: type === "exam" ? null : contentUrl,
        order_sequence: editing
          ? editing.order_sequence
          : classContents.length,
        duration_unit,
        duration_amount,
        start_date: startDate || null,
        end_date: endDate || null,
        timestamps: type === "watching" ? parseTimestamps(timestampsText) : [],
        class_id: editing ? undefined : (selectedClassId ?? undefined),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "تم تحديث الدرس" : "تم إضافة الدرس");
      setModal(false);
      router.refresh();
    });
  }

  function onDeleteContent() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteCourseContent(deleting.id, course.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف الدرس");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16 md:gap-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-primary/8 to-transparent px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl border border-primary/25 sm:w-64 md:w-80 lg:w-88">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                sizes="(min-width: 1024px) 352px, (min-width: 768px) 320px, (min-width: 640px) 256px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center text-primary/35">
                <Rosette className="size-16" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                  course.is_published
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                    : "bg-amber-50 text-amber-800 ring-amber-200"
                }`}
              >
                {course.is_published ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
                {course.is_published ? "منشور" : "مخفي"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                  course.visibility === "private"
                    ? "bg-violet-50 text-violet-800 ring-violet-200"
                    : "bg-slate-50 text-slate-700 ring-slate-200"
                }`}
              >
                {course.visibility === "private" ? (
                  <Shield className="size-3.5" />
                ) : (
                  <Globe className="size-3.5" />
                )}
                {VISIBILITY_LABELS[course.visibility ?? "public"]}
              </span>
            </div>
            <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {course.title}
            </h1>
            {course.description && (
              <p className="max-w-xl text-base leading-8 text-foreground/65">
                {course.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/2.5 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-primary/20 ring-inset">
                <StarRating
                  value={course.rating_avg}
                  count={course.rating_count}
                />
              </span>
            </div>
          </div>
        </div>

      </header>

      <CourseClassesPanel
        courseId={course.id}
        classes={classes}
        selectedId={selectedClassId}
        onSelect={setSelectedClassId}
        summaries={classSummaries}
      />

      <div className="space-y-8 rounded-3xl border border-border/70 bg-background/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-kufam text-2xl font-semibold text-foreground">
              {selectedClass ? `الدفعة ${selectedClassNumber}` : "اختر دفعة"}
            </h2>
            {selectedClass && isClassOpen(selectedClass) && (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
                التسجيل مفتوح
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedClass
              ? `التسجيل ${formatRegistrationWindow(selectedClass)} · بداية التعلم ${formatClassDate(selectedClass.learning_starts_at)}`
              : "الدروس والملتحقون يتبعون الدفعة المحددة."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Book className="size-3.5" />
            الدروس
          </p>
          <p className="mt-1 font-kufam text-lg text-foreground">
            {classContents.filter((c) => c.type !== "exam").length}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleHelp className="size-3.5" />
            التقويمات
          </p>
          <p className="mt-1 font-kufam text-lg text-foreground">
            {classContents.filter((c) => c.type === "exam").length}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            الملتحقون
          </p>
          <p className="mt-1 font-kufam text-lg text-foreground">
            {classEnrollments.length}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-background/70 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5" />
            أكملوا
          </p>
          <p className="mt-1 font-kufam text-lg text-foreground">
            {completedCount}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h3 className="font-kufam text-xl font-semibold text-foreground">
              الدروس
            </h3>
            <p className="text-sm text-muted-foreground">
              تظهر فقط لمن التحق بهذه الدفعة.
              {classContents.length > 1 ? " اسحب لإعادة الترتيب." : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openCreate} className="gap-2" disabled={classes.length === 0}>
              <Plus className="size-4" />
              درس جديد
            </Button>
          </div>
        </div>

        {classContents.length > 0 ? (
          <ol className="rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
            {classContents.map((content, index) => {
              const Icon = CONTENT_TYPE_ICON[content.type];
              const openUpward = index >= classContents.length - 2;
              const questionCount =
                (localQuestionsByContent[content.id] ?? []).length;
              const questionPoints = (
                localQuestionsByContent[content.id] ?? []
              ).reduce((sum, q) => sum + q.points, 0);
              const rowActions = (
                <ListRowActions
                  items={[
                    {
                      key: "preview",
                      label: "معاينة",
                      icon: <Eye className="size-3.5" />,
                      onClick: () => setPreviewing(content),
                    },
                    ...(content.type === "exam"
                      ? [
                          {
                            key: "questions",
                            label: "إضافة سؤال",
                            icon: <CircleHelp className="size-3.5" />,
                            onClick: () => openQuestionDialog(content.id),
                          } satisfies KebabMenuItem,
                          {
                            key: "answers",
                            label: "الإجابات",
                            icon: <CheckCircle2 className="size-3.5" />,
                            href: `/dashboard/courses/${course.id}/exams/${content.id}`,
                          } satisfies KebabMenuItem,
                        ]
                      : []),
                    {
                      key: "edit",
                      label: "تعديل",
                      icon: <Pencil className="size-3.5" />,
                      onClick: () => openEdit(content),
                    },
                    {
                      key: "delete",
                      label: "حذف",
                      icon: <Trash2 className="size-3.5" />,
                      variant: "destructive",
                      onClick: () => setDeleting(content),
                    },
                  ]}
                  open={openMenuId === content.id}
                  onToggle={() =>
                    setOpenMenuId(
                      openMenuId === content.id ? null : content.id,
                    )
                  }
                  onClose={() => setOpenMenuId(null)}
                  menuPlacement={openUpward ? "up" : "down"}
                  ariaLabel="خيارات الدرس"
                />
              );
              const rowMeta = (
                <>
                  <span
                    className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-xl text-muted-foreground active:cursor-grabbing"
                    aria-hidden
                    title="اسحب لإعادة الترتيب"
                  >
                    <GripVertical className="size-4" />
                  </span>
                  <span className="w-6 shrink-0 text-center font-kufam text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-medium text-foreground">
                        {content.title}
                      </p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {CONTENT_TYPE_LABELS[content.type]}
                      </span>
                      {content.type === "exam" && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {questionCount} سؤال
                        </span>
                      )}
                    </div>
                    {content.author && (
                      <p className="truncate text-sm text-muted-foreground">
                        {content.author}
                      </p>
                    )}
                    {formatLessonDateRange(content) && (
                      <p className="truncate text-xs text-muted-foreground">
                        الفترة: {formatLessonDateRange(content)}
                      </p>
                    )}
                    {formatLessonDuration(content) && (
                      <p className="truncate text-xs text-muted-foreground">
                        المدة: {formatLessonDuration(content)}
                      </p>
                    )}
                    {content.content_url && (
                      <Link
                        href={content.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block truncate text-sm transition hover:text-primary hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {content.content_url}
                      </Link>
                    )}
                  </div>
                </>
              );

              return (
                <li
                  key={content.id}
                  draggable={!pending}
                  onDragStart={() => onLessonDragStart(content.id)}
                  onDragOver={(event) => onLessonDragOver(event, content.id)}
                  onDrop={() => onLessonDrop(content.id)}
                  onDragEnd={onLessonDragEnd}
                  className={cn(
                    "border-b border-border/60 last:border-b-0",
                    openMenuId === content.id ? "relative z-50" : "relative z-0",
                    draggingLessonId === content.id && "opacity-60",
                    dragOverLessonId === content.id &&
                      draggingLessonId != null &&
                      draggingLessonId !== content.id &&
                      "bg-primary/5",
                  )}
                >
                  {content.type === "exam" ? (
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-muted/40 sm:gap-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                        {rowMeta}
                        <div
                          className="flex shrink-0 items-center gap-2"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          {rowActions}
                          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                        </div>
                      </summary>

                      <div className="space-y-3 border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-kufam text-sm text-foreground">
                            الأسئلة
                            <span className="ms-2 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {questionCount}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {questionCount > 1 && (
                              <span>اسحب لإعادة الترتيب</span>
                            )}
                            <span>المجموع: {questionPoints} نقطة</span>
                          </div>
                        </div>
                        {questionCount > 0 ? (
                          <ol className="space-y-2">
                            {(localQuestionsByContent[content.id] ?? []).map(
                              (q, qIndex) => (
                                <li
                                  key={q.id}
                                  draggable={!pending}
                                  onDragStart={(event) => {
                                    event.stopPropagation();
                                    onQuestionDragStart(q.id);
                                  }}
                                  onDragOver={(event) => {
                                    event.stopPropagation();
                                    onQuestionDragOver(event, q.id);
                                  }}
                                  onDrop={(event) =>
                                    onQuestionDrop(event, content.id, q.id)
                                  }
                                  onDragEnd={onQuestionDragEnd}
                                  className={cn(
                                    "flex items-center gap-2 rounded-2xl border bg-background px-2 py-2.5 shadow-sm transition sm:gap-3 sm:px-3",
                                    draggingQuestionId === q.id
                                      ? "border-primary/50 opacity-60"
                                      : dragOverQuestionId === q.id &&
                                          draggingQuestionId != null &&
                                          draggingQuestionId !== q.id
                                        ? "border-primary border-dashed bg-primary/5"
                                        : "border-border/70",
                                  )}
                                >
                                  <span
                                    className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-xl text-muted-foreground active:cursor-grabbing"
                                    aria-hidden
                                    title="اسحب لإعادة الترتيب"
                                  >
                                    <GripVertical className="size-4" />
                                  </span>
                                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-kufam text-xs text-primary">
                                    {qIndex + 1}
                                  </span>
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <p
                                      dir="rtl"
                                      className="line-clamp-2 text-start text-sm leading-6 text-foreground"
                                    >
                                      {q.question_text}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                      <span className="rounded-md border border-border px-2 py-0.5">
                                        {
                                          EXAM_QUESTION_TYPE_LABELS[
                                            q.question_type
                                          ]
                                        }
                                      </span>
                                      <span className="rounded-md border border-border px-2 py-0.5">
                                        {q.points === 0
                                          ? "بدون نقاط"
                                          : q.points === 1
                                            ? "نقطة"
                                            : q.points === 2
                                              ? "نقطتان"
                                              : `${q.points} نقاط`}
                                      </span>
                                      {q.is_optional && (
                                        <span className="rounded-md border border-border px-2 py-0.5">
                                          اختياري
                                        </span>
                                      )}
                                      {isChoiceQuestionType(q.question_type) &&
                                        q.correct_option_ids.length === 0 && (
                                          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-900">
                                            بدون تصحيح آلي
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      disabled={pending}
                                      onClick={() =>
                                        openQuestionDialog(content.id, q)
                                      }
                                      aria-label="تعديل السؤال"
                                    >
                                      <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-muted-foreground hover:text-destructive"
                                      disabled={pending}
                                      onClick={() => setDeletingQuestion(q)}
                                      aria-label="حذف السؤال"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                </li>
                              ),
                            )}
                          </ol>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openQuestionDialog(content.id)}
                            className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-border px-3 py-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/4"
                          >
                            <Plus className="size-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              لا أسئلة بعد
                            </span>
                            <span className="text-xs text-muted-foreground">
                              اضغط لإضافة أول سؤال
                            </span>
                          </button>
                        )}
                      </div>
                    </details>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
                      {rowMeta}
                      {rowActions}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
            <p className="font-kufam text-lg text-foreground">لا دروس في هذه الدفعة</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              أضف مشاهدة أو استماع أو قراءة أو تقويماً. الدروس لا تظهر إلا لملتحقي هذه الدفعة.
            </p>
          </div>
        )}
      </section>


      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h3 className="font-kufam text-xl font-semibold text-foreground">
              الملتحقون
            </h3>
            <p className="text-sm text-muted-foreground">
              من انضم خلال فترة تسجيل هذه الدفعة.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {classEnrollments.length} عضو
          </span>
        </div>

        {classEnrollments.length > 0 ? (
          <ul className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-[0_4px_24px_-18px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
            {classEnrollments.map((enrollment) => {
              const done =
                enrollment.status === "completed" ||
                enrollment.progress_percentage >= 100;
              const role = enrollment.member.role;
              return (
                <li
                  key={enrollment.id}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <Link
                    href={`/dashboard/members/${enrollment.member.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-muted/40 sm:gap-4 sm:px-6"
                  >
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
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate font-kufam text-lg text-foreground">
                          {enrollment.member.name}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_STYLES[role]}`}
                        >
                          {MEMBER_ROLE_LABELS[role]}
                        </span>
                      </div>
                      {(enrollment.member.phone ||
                        enrollment.member.login) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {enrollment.member.phone ??
                            (enrollment.member.login
                              ? `@${enrollment.member.login}`
                              : "")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {ratingsByMember[enrollment.member_id] && (
                        <StarRating
                          value={ratingsByMember[enrollment.member_id]}
                        />
                      )}
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {Math.round(enrollment.progress_percentage)}%
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          done
                            ? "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30"
                            : "bg-sky-500/15 text-sky-800 ring-sky-500/30"
                        }`}
                      >
                        {done ? (
                          <>
                            <CheckCircle2 className="size-3.5" />
                            مكتمل
                          </>
                        ) : (
                          "قيد التعلم"
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
            <Users className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              لا يوجد ملتحقون بهذه الدفعة بعد.
            </p>
          </div>
        )}
      </section>
      </div>

      {examState && (
        <ExamQuestionsDialog
          key={`${examState.contentId}-${examState.question?.id ?? "new"}`}
          courseId={course.id}
          contentId={examState.contentId}
          contentTitle={examTitle}
          question={examState.question}
          nextOrder={(questionsByContent[examState.contentId] ?? []).length}
          onClose={() => setExamState(null)}
        />
      )}

      <ConfirmDeleteModal
        open={Boolean(deletingQuestion)}
        title="حذف السؤال"
        description={
          deletingQuestion ? `حذف «${deletingQuestion.question_text}»؟` : ""
        }
        confirmLabel="حذف"
        pending={pending}
        onCancel={() => !pending && setDeletingQuestion(null)}
        onConfirm={onDeleteQuestion}
      />

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="حذف الدرس"
        description={deleting ? `حذف «${deleting.title}»؟` : ""}
        confirmLabel="حذف"
        pending={pending}
        onCancel={() => !pending && setDeleting(null)}
        onConfirm={onDeleteContent}
      />

      {previewing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            className="absolute inset-0"
            onClick={() => setPreviewing(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-preview-title"
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="mt-1 font-kufam text-muted-foreground">
                    {previewing.order_sequence}.
                  </p>
                  <h2
                    id="lesson-preview-title"
                    className="truncate text-xl text-foreground"
                  >
                    {previewing.title}
                  </h2>
                </div>
                {previewing.author && (
                  <p className="truncate text-sm text-muted-foreground">
                    {previewing.author}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewing(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                aria-label="إغلاق"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {previewing.type === "watching" && previewing.content_url ? (
                <VideoViewer
                  title={previewing.title}
                  url={previewing.content_url}
                  timestamps={previewing.metadata.timestamps ?? []}
                />
              ) : previewing.type === "listening" && previewing.content_url ? (
                <AudioViewer
                  title={previewing.title}
                  url={previewing.content_url}
                />
              ) : previewing.type === "reading" && previewing.content_url ? (
                <ReadingViewer
                  title={previewing.title}
                  url={previewing.content_url}
                />
              ) : previewing.type === "exam" ? (
                <div className="space-y-4">
                  <p className="font-kufam text-lg text-foreground">
                    أسئلة التقويم
                  </p>
                  {(questionsByContent[previewing.id] ?? []).length > 0 ? (
                    <ol className="space-y-3">
                      {(questionsByContent[previewing.id] ?? []).map(
                        (q, index) => (
                          <li
                            key={q.id}
                            className="rounded-2xl border border-border/70 bg-background/70 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-medium text-foreground">
                                <span className="me-2 font-kufam text-sm text-muted-foreground">
                                  {index + 1}.
                                </span>
                                {q.question_text}
                              </p>
                              <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                                <span className="rounded-full border border-border/70 px-2 py-0.5">
                                  {EXAM_QUESTION_TYPE_LABELS[q.question_type]}
                                </span>
                                <span className="rounded-full border border-border/70 px-2 py-0.5">
                                  {q.points}{" "}
                                  {q.points === 1
                                    ? "نقطة"
                                    : q.points === 2
                                      ? "نقطتان"
                                      : `${q.points} نقاط`}
                                </span>
                              </div>
                            </div>
                            {isChoiceQuestionType(q.question_type) ? (
                              <ul className="mt-3 space-y-1.5" dir="rtl">
                                {q.options.map((option) => {
                                  const correct =
                                    q.correct_option_ids.includes(option.id);
                                  return (
                                    <li
                                      key={option.id}
                                      className={`rounded-xl border px-3 py-2 text-start text-sm ${
                                        correct
                                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900"
                                          : "border-border/70 text-foreground/75"
                                      }`}
                                    >
                                      {option.text}
                                      {correct && (
                                        <span className="ms-2 text-xs text-emerald-700">
                                          (صحيحة)
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                                {q.correct_option_ids.length === 0 && (
                                  <li className="text-xs text-amber-800">
                                    بدون إجابة صحيحة — لا يُحتسب في النقاط
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <p className="mt-3 text-xs text-muted-foreground">
                                إجابة نصية — تُراجع يدوياً لاحقاً
                              </p>
                            )}
                          </li>
                        ),
                      )}
                    </ol>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      لا أسئلة بعد لهذا التقويم.
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  لا يوجد محتوى للمعاينة. أضف رابطاً أولاً.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <FormDialog
          title={editing ? "تعديل الدرس" : "درس جديد"}
          onClose={() => setModal(false)}
          onSubmit={onSubmitContent}
          pending={pending}
          submitLabel="حفظ"
          maxWidthClassName="max-w-lg"
        >
          <p className="text-xs text-muted-foreground">
            الحقول المعلَّمة بـ <span className="text-destructive">*</span>{" "}
            إلزامية
          </p>

          <fieldset className="space-y-2">
            <legend className={cn("text-sm font-medium leading-none", REQUIRED_MARK)}>
              نوع الدرس
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CONTENT_TYPE_LABELS) as CourseContentType[]).map(
                (key) => {
                  const TypeIcon = CONTENT_TYPE_ICON[key];
                  const selected = type === key;
                  return (
                    <label
                      key={key}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                        selected
                          ? "border-primary/50 bg-primary/8 ring-1 ring-primary/20"
                          : "border-border bg-background hover:bg-muted/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="lesson-type"
                        className="sr-only"
                        checked={selected}
                        onChange={() => setType(key)}
                      />
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          selected
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <TypeIcon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-sm font-medium",
                            selected ? "text-foreground" : "text-foreground/80",
                          )}
                        >
                          {CONTENT_TYPE_LABELS[key]}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {CONTENT_TYPE_HINT[key]}
                        </span>
                      </span>
                    </label>
                  );
                },
              )}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="lesson-title" className={REQUIRED_MARK}>
              العنوان
            </Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مقدمة في الموضوع"
              required
            />
          </div>

          {type !== "exam" && (
            <div className="space-y-2">
              <Label htmlFor="lesson-author">المؤلف</Label>
              <Input
                id="lesson-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="اختياري"
              />
            </div>
          )}

          {type !== "exam" && (
            <div className="space-y-2">
              <Label htmlFor="lesson-url" className={REQUIRED_MARK}>
                {type === "watching"
                  ? "رابط يوتيوب"
                  : type === "listening"
                    ? "رابط الصوت"
                    : "رابط PDF / Drive"}
              </Label>
              <Input
                id="lesson-url"
                dir="ltr"
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                required
                placeholder="https://"
              />
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarDays className="size-4 text-muted-foreground" />
              الجدولة
              <span className="text-xs font-normal text-muted-foreground">
                (اختياري)
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="lesson-start-date"
                  className="text-xs text-muted-foreground"
                >
                  تاريخ البداية
                </Label>
                <Input
                  id="lesson-start-date"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="lesson-end-date"
                  className="text-xs text-muted-foreground"
                >
                  تاريخ النهاية
                </Label>
                <Input
                  id="lesson-end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="lesson-duration"
                className="text-xs text-muted-foreground"
              >
                مدة الدرس
              </Label>
              <div className="flex items-stretch gap-2">
                <Input
                  id="lesson-duration"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={durationAmount}
                  onChange={(event) => setDurationAmount(event.target.value)}
                  placeholder="—"
                  className="w-24 bg-background text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <div
                  role="radiogroup"
                  aria-label="وحدة المدة"
                  className="grid flex-1 grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1"
                >
                  {(
                    [
                      { value: "days", label: "أيام", icon: CalendarDays },
                      { value: "hours", label: "ساعات", icon: Clock },
                    ] as const
                  ).map((option) => {
                    const selected = durationUnit === option.value;
                    const UnitIcon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setDurationUnit(option.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg text-sm transition",
                          selected
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-muted/50",
                        )}
                      >
                        <UnitIcon className="size-3.5" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {type === "watching" && (
            <div className="space-y-2">
              <Label htmlFor="lesson-timestamps">الطوابع الزمنية</Label>
              <p className="text-xs text-muted-foreground">
                سطر لكل طابع بالصيغة: الثواني|العنوان
              </p>
              <Textarea
                id="lesson-timestamps"
                rows={4}
                value={timestampsText}
                onChange={(e) => setTimestampsText(e.target.value)}
                className="font-mono text-sm"
                placeholder={"0|المقدمة\n120|الفكرة الأولى"}
                dir="ltr"
              />
            </div>
          )}
        </FormDialog>
      )}
    </div>
  );
}
