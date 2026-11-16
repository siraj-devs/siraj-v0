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
export type EnrollmentClassRole = "participant" | "supervisor";
export type ExamQuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_text"
  | "long_text";

export const ENROLLMENT_CLASS_ROLE_LABELS: Record<EnrollmentClassRole, string> =
  {
    participant: "مشارك",
    supervisor: "مشرف",
  };

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
  order_sequence: number;
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
  class_role: EnrollmentClassRole;
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

/** Graded exam completion used for class leaderboard scoring. */
export type ExamCompletionScore = {
  enrollment_id: number;
  content_id: number;
  exam_score: number | null;
  exam_graded_at: string | null;
};

export type ClassLeaderboardEntry = {
  rank: number;
  enrollmentId: number;
  member: {
    id: number;
    name: string;
    avatar: string | null;
  };
  progressPercentage: number;
  /** Progress contribution (0–100). */
  progressPoints: number;
  /** Earned exam points from graded تقويمات. */
  examPoints: number;
  /** Max exam points available in the class. */
  examMaxPoints: number;
  /** progressPoints + examPoints. */
  totalPoints: number;
};

/**
 * Leaderboard score: class progress (0–100) + earned points from graded exams.
 * Supervisors are excluded by the caller before ranking.
 */
export function buildClassLeaderboard(
  enrollments: CourseEnrollmentWithMember[],
  examContents: Pick<CourseContent, "id">[],
  questionsByContent: Record<number, Pick<ExamQuestion, "points">[]>,
  examCompletions: ExamCompletionScore[],
): ClassLeaderboardEntry[] {
  const examIds = new Set(examContents.map((item) => item.id));
  const examMaxByContent = new Map<number, number>();
  let examMaxPoints = 0;
  for (const contentId of examIds) {
    const max = (questionsByContent[contentId] ?? []).reduce(
      (sum, question) => sum + Math.max(0, question.points),
      0,
    );
    examMaxByContent.set(contentId, max);
    examMaxPoints += max;
  }

  const completionsByEnrollment = new Map<number, ExamCompletionScore[]>();
  for (const row of examCompletions) {
    if (!examIds.has(row.content_id) || !row.exam_graded_at) continue;
    if (row.exam_score == null) continue;
    const list = completionsByEnrollment.get(row.enrollment_id) ?? [];
    list.push(row);
    completionsByEnrollment.set(row.enrollment_id, list);
  }

  const ranked = enrollments
    .filter((enrollment) => (enrollment.class_role ?? "participant") !== "supervisor")
    .map((enrollment) => {
      const progressPoints = Math.round(
        Math.min(100, Math.max(0, enrollment.progress_percentage)),
      );
      let examPoints = 0;
      for (const completion of completionsByEnrollment.get(enrollment.id) ?? []) {
        const max = examMaxByContent.get(completion.content_id) ?? 0;
        if (max <= 0 || completion.exam_score == null) continue;
        examPoints += (completion.exam_score / 100) * max;
      }
      examPoints = Math.round(examPoints * 100) / 100;
      return {
        enrollmentId: enrollment.id,
        member: {
          id: enrollment.member.id,
          name: enrollment.member.name,
          avatar: enrollment.member.avatar,
        },
        progressPercentage: enrollment.progress_percentage,
        progressPoints,
        examPoints,
        examMaxPoints,
        totalPoints: Math.round((progressPoints + examPoints) * 100) / 100,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.progressPoints !== a.progressPoints) {
        return b.progressPoints - a.progressPoints;
      }
      return a.member.name.localeCompare(b.member.name, "ar");
    });

  // Dense ranking: equal totals share a rank (1,2,3,3,4…).
  let denseRank = 1;
  return ranked.map((entry, index) => {
    if (
      index > 0 &&
      ranked[index - 1]!.totalPoints !== entry.totalPoints
    ) {
      denseRank += 1;
    }
    return { ...entry, rank: denseRank };
  });
}

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
