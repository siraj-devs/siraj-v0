import type { MemberRole } from "@/lib/member-role";

export type CourseVisibility = "public" | "private";

/** Member option shown in the course ACL picker (dashboard course form). */
export type CourseAclMemberOption = {
  id: number;
  name: string;
  role: MemberRole;
};
export type CourseContentType =
  | "watching"
  | "listening"
  | "reading"
  | "exam";
export type EnrollmentStatus = "active" | "completed" | "dropped";
export type ExamQuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_text"
  | "long_text";

export type VideoTimestamp = {
  label: string;
  seconds: number;
};

export type CourseContentMetadata = {
  timestamps?: VideoTimestamp[];
};

export type Course = {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  visibility: CourseVisibility;
  owner_id: number | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
};

export type CourseAcl = {
  roles: import("@/lib/member-role").MemberRole[];
  memberIds: number[];
};

export type CourseWithMeta = Course & {
  lesson_count: number;
  exam_count: number;
  enrollment_count: number;
  registration_open?: boolean;
  allowed_roles?: import("@/lib/member-role").MemberRole[];
  allowed_member_ids?: number[];
};

export type CourseContent = {
  id: number;
  course_id: number;
  class_id: number | null;
  type: CourseContentType;
  title: string;
  author: string | null;
  content_url: string | null;
  order_sequence: number;
  duration_unit: import("@/lib/course-schedule").DurationUnit | null;
  duration_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  metadata: CourseContentMetadata;
};

export type ExamOption = {
  id: string;
  text: string;
};

export type ExamQuestion = {
  id: number;
  content_id: number;
  question_text: string;
  question_type: ExamQuestionType;
  options: ExamOption[];
  /** @deprecated Prefer correct_option_ids; kept for older rows/UI. */
  correct_option_id: string | null;
  correct_option_ids: string[];
  allow_multiple: boolean;
  is_optional: boolean;
  points: number;
  order_sequence: number;
};

export type ExamAnswerRecord = {
  question_id: number;
  selected_option_ids: string[];
  answer_text: string | null;
  /** null = awaiting manual grade */
  points_awarded: number | null;
  graded_at: string | null;
};

export type ExamSubmission = {
  enrollment_id: number;
  submitted_at: string;
  /** Final published score (0-100); null until published / auto-finalized. */
  score: number | null;
  feedback: string | null;
  /** When set, learner may see score + summary. */
  graded_at: string | null;
  answers: ExamAnswerRecord[];
};

export const EXAM_QUESTION_TYPE_LABELS: Record<ExamQuestionType, string> = {
  multiple_choice: "اختيار من متعدد",
  true_false: "صح / خطأ",
  short_text: "إجابة قصيرة",
  long_text: "إجابة طويلة",
};

export function isChoiceQuestionType(type: ExamQuestionType) {
  return type === "multiple_choice" || type === "true_false";
}

export function isTextQuestionType(type: ExamQuestionType) {
  return type === "short_text" || type === "long_text";
}

/** Choice questions with at least one correct option are auto-scored. */
export function isAutoGradableQuestion(question: Pick<
  ExamQuestion,
  "question_type" | "correct_option_ids"
>) {
  return (
    isChoiceQuestionType(question.question_type) &&
    question.correct_option_ids.length > 0
  );
}

/** Manual teacher grade only when the question carries points and isn't auto-scored. */
export function needsManualGrade(question: Pick<
  ExamQuestion,
  "question_type" | "correct_option_ids" | "points"
>) {
  return !isAutoGradableQuestion(question) && question.points > 0;
}

/**
 * Partial credit for multi-correct: each correctly selected option earns
 * points / |correct|. Wrong selections award 0 (no penalty).
 */
export function computeAutoPoints(
  question: Pick<ExamQuestion, "points" | "correct_option_ids">,
  selectedIds: string[],
): number {
  const correct = question.correct_option_ids;
  if (correct.length === 0 || question.points <= 0) return 0;
  const selected = new Set(selectedIds);
  const hits = correct.filter((id) => selected.has(id)).length;
  const per = question.points / correct.length;
  return Math.round(hits * per * 100) / 100;
}

export function computeExamScorePercent(
  questions: Pick<ExamQuestion, "id" | "points">[],
  answers: Pick<ExamAnswerRecord, "question_id" | "points_awarded">[],
): number | null {
  const byId = new Map(questions.map((q) => [q.id, q]));
  let earned = 0;
  let max = 0;
  for (const answer of answers) {
    if (answer.points_awarded == null) continue;
    const question = byId.get(answer.question_id);
    if (!question) continue;
    max += question.points;
    earned += answer.points_awarded;
  }
  if (max <= 0) return null;
  return Math.round((earned / max) * 10000) / 100;
}

export type Enrollment = {
  id: number;
  member_id: number;
  course_id: number;
  progress_percentage: number;
  status: EnrollmentStatus;
  class_id: number | null;
  created_at: string;
  updated_at: string;
};

export type CourseEnrollmentWithMember = Enrollment & {
  member: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    role: import("@/lib/member-role").MemberRole;
    avatar: string | null;
    login: string | null;
  };
};

export type ContentCompletion = {
  id: number;
  enrollment_id: number;
  content_id: number;
  completed: boolean;
  exam_score: number | null;
  completed_at: string;
};

export const CONTENT_TYPE_LABELS: Record<CourseContentType, string> = {
  watching: "مشاهدة",
  listening: "استماع",
  reading: "قراءة",
  exam: "تقويم",
};

export const VISIBILITY_LABELS: Record<CourseVisibility, string> = {
  public: "عام",
  private: "خاص",
};

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (trimmed.includes("youtube.com/embed/")) return trimmed;

    const parsed = new URL(trimmed);
    let id: string | null = null;

    if (parsed.hostname.includes("youtu.be")) {
      id = parsed.pathname.replace("/", "") || null;
    } else if (parsed.hostname.includes("youtube.com")) {
      id = parsed.searchParams.get("v");
      if (!id && parsed.pathname.startsWith("/embed/")) {
        id = parsed.pathname.split("/")[2] ?? null;
      }
      if (!id && parsed.pathname.startsWith("/shorts/")) {
        id = parsed.pathname.split("/")[2] ?? null;
      }
    }

    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export function pdfEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.includes("drive.google.com")) {
    const match = trimmed.match(/\/d\/([^/]+)/);
    if (match?.[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return trimmed;
}
