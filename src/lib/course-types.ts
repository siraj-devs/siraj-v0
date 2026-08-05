export type CourseEnrollmentStatus = "open" | "closed";
export type CourseContentType =
  | "watching"
  | "listening"
  | "reading"
  | "exam";
export type EnrollmentStatus = "active" | "completed" | "dropped";
export type ExamQuestionType = "multiple_choice" | "true_false";

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
  description: string;
  thumbnail_url: string | null;
  is_published: boolean;
  enrollment_status: CourseEnrollmentStatus;
  owner_id: number | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
};

export type CourseWithMeta = Course & {
  lesson_count: number;
};

export type CourseContent = {
  id: number;
  course_id: number;
  type: CourseContentType;
  title: string;
  content_url: string | null;
  order_sequence: number;
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
  correct_option_id: string;
  order_sequence: number;
};

export type Enrollment = {
  id: number;
  member_id: number;
  course_id: number;
  progress_percentage: number;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string;
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
  exam: "اختبار",
};

export const ENROLLMENT_STATUS_LABELS: Record<
  CourseEnrollmentStatus,
  string
> = {
  open: "مفتوح",
  closed: "مغلق",
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
