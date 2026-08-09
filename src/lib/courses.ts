import type {
  Course,
  CourseAcl,
  CourseContent,
  CourseContentMetadata,
  CourseEnrollmentWithMember,
  CourseVisibility,
  CourseWithMeta,
  Enrollment,
  ExamQuestion,
  ExamOption,
} from "@/lib/course-types";
import type { AppMember } from "@/lib/members";
import type { MemberRole } from "@/lib/member-role";
import { createClient } from "@/lib/supabase/server";

function mapContent(row: {
  id: number;
  course_id: number;
  type: CourseContent["type"];
  title: string;
  content_url: string | null;
  order_sequence: number;
  metadata: CourseContentMetadata | null;
}): CourseContent {
  return {
    id: row.id,
    course_id: row.course_id,
    type: row.type,
    title: row.title,
    content_url: row.content_url,
    order_sequence: Number(row.order_sequence) || 0,
    metadata: row.metadata ?? {},
  };
}

function mapQuestion(row: {
  id: number;
  content_id: number;
  question_text: string;
  question_type: ExamQuestion["question_type"];
  options: ExamOption[] | null;
  correct_option_id: string;
  order_sequence: number;
}): ExamQuestion {
  return {
    id: row.id,
    content_id: row.content_id,
    question_text: row.question_text,
    question_type: row.question_type,
    options: Array.isArray(row.options) ? row.options : [],
    correct_option_id: row.correct_option_id,
    order_sequence: Number(row.order_sequence) || 0,
  };
}

function mapCourse(row: Record<string, unknown>): Course {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    is_published: Boolean(row.is_published),
    enrollment_status: row.enrollment_status as Course["enrollment_status"],
    visibility: (row.visibility as CourseVisibility) ?? "public",
    owner_id: (row.owner_id as number | null) ?? null,
    rating_avg: Number(row.rating_avg) || 0,
    rating_count: Number(row.rating_count) || 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

const COURSE_COLUMNS =
  "id, title, description, thumbnail_url, is_published, enrollment_status, visibility, owner_id, rating_avg, rating_count, created_at, updated_at";

export function canAccessCourse(
  course: Pick<Course, "visibility">,
  member: Pick<AppMember, "id" | "role"> | null | undefined,
  acl: CourseAcl,
): boolean {
  if (course.visibility !== "private") return true;
  if (!member) return false;
  if (acl.memberIds.includes(member.id)) return true;
  if (acl.roles.includes(member.role)) return true;
  return false;
}

export async function getCourseAcl(courseId: number): Promise<CourseAcl> {
  const supabase = await createClient();
  const [{ data: roles }, { data: members }] = await Promise.all([
    supabase
      .from("course_allowed_roles")
      .select("role")
      .eq("course_id", courseId),
    supabase
      .from("course_allowed_members")
      .select("member_id")
      .eq("course_id", courseId),
  ]);

  return {
    roles: (roles ?? []).map((r) => r.role as MemberRole),
    memberIds: (members ?? []).map((m) => m.member_id as number),
  };
}

async function getCourseAclsForIds(
  courseIds: number[],
): Promise<Map<number, CourseAcl>> {
  const map = new Map<number, CourseAcl>();
  for (const id of courseIds) {
    map.set(id, { roles: [], memberIds: [] });
  }
  if (courseIds.length === 0) return map;

  const supabase = await createClient();
  const [{ data: roles }, { data: members }] = await Promise.all([
    supabase
      .from("course_allowed_roles")
      .select("course_id, role")
      .in("course_id", courseIds),
    supabase
      .from("course_allowed_members")
      .select("course_id, member_id")
      .in("course_id", courseIds),
  ]);

  for (const row of roles ?? []) {
    const acl = map.get(row.course_id as number);
    if (acl) acl.roles.push(row.role as MemberRole);
  }
  for (const row of members ?? []) {
    const acl = map.get(row.course_id as number);
    if (acl) acl.memberIds.push(row.member_id as number);
  }
  return map;
}

export async function replaceCourseAcl(
  courseId: number,
  acl: CourseAcl,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const { error: delRolesError } = await supabase
    .from("course_allowed_roles")
    .delete()
    .eq("course_id", courseId);
  if (delRolesError) {
    console.error("Error clearing course roles:", delRolesError);
    return { success: false, error: "تعذر تحديث صلاحيات الأدوار" };
  }

  const { error: delMembersError } = await supabase
    .from("course_allowed_members")
    .delete()
    .eq("course_id", courseId);
  if (delMembersError) {
    console.error("Error clearing course members:", delMembersError);
    return { success: false, error: "تعذر تحديث صلاحيات الأعضاء" };
  }

  if (acl.roles.length > 0) {
    const { error } = await supabase.from("course_allowed_roles").insert(
      acl.roles.map((role) => ({ course_id: courseId, role })),
    );
    if (error) {
      console.error("Error inserting course roles:", error);
      return { success: false, error: "تعذر حفظ الأدوار المسموحة" };
    }
  }

  if (acl.memberIds.length > 0) {
    const { error } = await supabase.from("course_allowed_members").insert(
      acl.memberIds.map((member_id) => ({ course_id: courseId, member_id })),
    );
    if (error) {
      console.error("Error inserting course members:", error);
      return { success: false, error: "تعذر حفظ الأعضاء المسموح لهم" };
    }
  }

  return { success: true };
}

async function attachCourseMeta(
  courses: Course[],
  options?: { includeAcl?: boolean },
): Promise<CourseWithMeta[]> {
  if (courses.length === 0) return [];

  const supabase = await createClient();
  const ids = courses.map((c) => c.id);

  const [{ data: contents }, { data: enrollments }, acls] = await Promise.all([
    supabase.from("course_contents").select("course_id, type").in("course_id", ids),
    supabase.from("enrollments").select("course_id").in("course_id", ids),
    options?.includeAcl
      ? getCourseAclsForIds(ids)
      : Promise.resolve(null as Map<number, CourseAcl> | null),
  ]);

  const lessonCounts = new Map<number, number>();
  const examCounts = new Map<number, number>();
  for (const row of contents ?? []) {
    if (row.type === "exam") {
      examCounts.set(row.course_id, (examCounts.get(row.course_id) ?? 0) + 1);
    } else {
      lessonCounts.set(
        row.course_id,
        (lessonCounts.get(row.course_id) ?? 0) + 1,
      );
    }
  }

  const enrollmentCounts = new Map<number, number>();
  for (const row of enrollments ?? []) {
    enrollmentCounts.set(
      row.course_id,
      (enrollmentCounts.get(row.course_id) ?? 0) + 1,
    );
  }

  return courses.map((course) => {
    const acl = acls?.get(course.id);
    return {
      ...course,
      rating_avg: Number(course.rating_avg) || 0,
      rating_count: Number(course.rating_count) || 0,
      lesson_count: lessonCounts.get(course.id) ?? 0,
      exam_count: examCounts.get(course.id) ?? 0,
      enrollment_count: enrollmentCounts.get(course.id) ?? 0,
      ...(acl
        ? {
            allowed_roles: acl.roles,
            allowed_member_ids: acl.memberIds,
          }
        : {}),
    };
  });
}

export async function getPublishedCourses(
  member?: Pick<AppMember, "id" | "role"> | null,
): Promise<CourseWithMeta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching published courses:", error);
    return [];
  }

  const courses = (data ?? []).map((row) => mapCourse(row));
  const privateIds = courses
    .filter((c) => c.visibility === "private")
    .map((c) => c.id);
  const acls = await getCourseAclsForIds(privateIds);

  const visible = courses.filter((course) => {
    if (course.visibility !== "private") return true;
    return canAccessCourse(
      course,
      member,
      acls.get(course.id) ?? { roles: [], memberIds: [] },
    );
  });

  return attachCourseMeta(visible);
}

export async function getAllCoursesForDashboard(): Promise<CourseWithMeta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses for dashboard:", error);
    return [];
  }

  return attachCourseMeta(
    (data ?? []).map((row) => mapCourse(row)),
    { includeAcl: true },
  );
}

export async function getCourseById(
  id: number,
  options?: { includeAcl?: boolean },
): Promise<CourseWithMeta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Error fetching course:", error);
    return null;
  }

  const [withMeta] = await attachCourseMeta([mapCourse(data)], {
    includeAcl: options?.includeAcl,
  });
  return withMeta ?? null;
}

export async function getCourseContents(
  courseId: number,
): Promise<CourseContent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_contents")
    .select(
      "id, course_id, type, title, content_url, order_sequence, metadata",
    )
    .eq("course_id", courseId)
    .order("order_sequence", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching course contents:", error);
    return [];
  }

  return (data ?? []).map(mapContent);
}

export async function getCourseContentById(
  contentId: number,
): Promise<CourseContent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_contents")
    .select(
      "id, course_id, type, title, content_url, order_sequence, metadata",
    )
    .eq("id", contentId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Error fetching content:", error);
    return null;
  }

  return mapContent(data);
}

export async function getExamQuestions(
  contentId: number,
): Promise<ExamQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_questions")
    .select(
      "id, content_id, question_text, question_type, options, correct_option_id, order_sequence",
    )
    .eq("content_id", contentId)
    .order("order_sequence", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching exam questions:", error);
    return [];
  }

  return (data ?? []).map(mapQuestion);
}

/** Public exam view: strip correct answers. */
export async function getExamQuestionsForLearner(
  contentId: number,
): Promise<Omit<ExamQuestion, "correct_option_id">[]> {
  const questions = await getExamQuestions(contentId);
  return questions.map(({ correct_option_id: _, ...rest }) => rest);
}

export async function getEnrollment(
  memberId: number,
  courseId: number,
): Promise<Enrollment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, member_id, course_id, progress_percentage, status, created_at, updated_at",
    )
    .eq("member_id", memberId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching enrollment:", error);
    return null;
  }

  if (!data) return null;
  return {
    ...(data as Enrollment),
    progress_percentage: Number(data.progress_percentage) || 0,
  };
}

export async function getEnrolledCourseIds(
  memberId: number,
): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("member_id", memberId);

  if (error) {
    console.error("Error fetching enrollments:", error);
    return [];
  }

  return (data ?? []).map((row) => row.course_id as number);
}

export async function getMyCourseRating(
  memberId: number,
  courseId: number,
): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_ratings")
    .select("rating")
    .eq("member_id", memberId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching course rating:", error);
    return null;
  }

  return data ? Number(data.rating) || null : null;
}

export async function getCourseEnrollments(
  courseId: number,
): Promise<CourseEnrollmentWithMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, member_id, course_id, progress_percentage, status, created_at, updated_at, members ( id, name, email, role )",
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching course enrollments:", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const memberRaw = row.members;
    const member = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;
    if (!member) return [];

    return [
      {
        id: row.id as number,
        member_id: row.member_id as number,
        course_id: row.course_id as number,
        progress_percentage: Number(row.progress_percentage) || 0,
        status: row.status as CourseEnrollmentWithMember["status"],
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        member: {
          id: member.id as number,
          name: member.name as string,
          email: (member.email as string | null) ?? null,
          role: member.role as string,
        },
      },
    ];
  });
}

export async function getCourseRatingsByMember(
  courseId: number,
): Promise<Record<number, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_ratings")
    .select("member_id, rating")
    .eq("course_id", courseId);

  if (error) {
    console.error("Error fetching course ratings:", error);
    return {};
  }

  const map: Record<number, number> = {};
  for (const row of data ?? []) {
    map[row.member_id as number] = Number(row.rating) || 0;
  }
  return map;
}

export async function getCompletedContentIds(
  enrollmentId: number,
): Promise<Set<number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_completions")
    .select("content_id")
    .eq("enrollment_id", enrollmentId)
    .eq("completed", true);

  if (error) {
    console.error("Error fetching completions:", error);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.content_id as number));
}
