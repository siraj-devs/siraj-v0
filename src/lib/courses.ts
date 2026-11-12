import type {
  Course,
  CourseAcl,
  CourseContent,
  CourseContentMetadata,
  CourseEnrollmentWithMember,
  CourseVisibility,
  CourseWithMeta,
  Enrollment,
  ExamAnswerRecord,
  ExamQuestion,
  ExamSubmission,
  ExamOption,
} from "@/lib/course-types";
import type { AppMember } from "@/lib/members";
import type { DurationUnit } from "@/lib/course-schedule";
import {
  hasLearningStarted,
  isClassOpen,
  pickOpenClass,
  type CourseClass,
} from "@/lib/course-schedule";
import type { MemberRole } from "@/lib/member-role";
import { createClient } from "@/lib/supabase/server";

function mapContent(row: {
  id: number;
  course_id: number;
  class_id?: number | null;
  type: CourseContent["type"];
  title: string;
  author: string | null;
  content_url: string | null;
  order_sequence: number;
  duration_unit: string | null;
  duration_amount: number | null;
  start_date?: string | null;
  end_date?: string | null;
  metadata: CourseContentMetadata | null;
}): CourseContent {
  const durationUnit =
    row.duration_unit === "hours" || row.duration_unit === "days"
      ? (row.duration_unit as DurationUnit)
      : null;
  const durationAmount =
    durationUnit && row.duration_amount && row.duration_amount > 0
      ? Number(row.duration_amount)
      : null;
  return {
    id: row.id,
    course_id: row.course_id,
    class_id: row.class_id ?? null,
    type: row.type,
    title: row.title,
    author: row.author?.trim() || null,
    content_url: row.content_url,
    order_sequence: Number(row.order_sequence) || 0,
    duration_unit: durationAmount ? durationUnit : null,
    duration_amount: durationAmount,
    start_date: row.start_date?.slice(0, 10) || null,
    end_date: row.end_date?.slice(0, 10) || null,
    metadata: row.metadata ?? {},
  };
}

function mapQuestion(row: {
  id: number;
  content_id: number;
  question_text: string;
  question_type: ExamQuestion["question_type"];
  options: ExamOption[] | null;
  correct_option_id: string | null;
  correct_option_ids?: string[] | null;
  allow_multiple?: boolean | null;
  is_optional?: boolean | null;
  points?: number | null;
  order_sequence: number;
}): ExamQuestion {
  const fromArray = Array.isArray(row.correct_option_ids)
    ? row.correct_option_ids.filter((id): id is string => typeof id === "string")
    : [];
  const correct_option_ids =
    fromArray.length > 0
      ? fromArray
      : row.correct_option_id
        ? [row.correct_option_id]
        : [];

  return {
    id: row.id,
    content_id: row.content_id,
    question_text: row.question_text,
    question_type: row.question_type,
    options: Array.isArray(row.options) ? row.options : [],
    correct_option_id: row.correct_option_id ?? correct_option_ids[0] ?? null,
    correct_option_ids,
    allow_multiple: Boolean(row.allow_multiple) || correct_option_ids.length > 1,
    is_optional: Boolean(row.is_optional),
    points: (() => {
      const raw = Number(row.points);
      return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 1;
    })(),
    order_sequence: Number(row.order_sequence) || 0,
  };
}

function mapCourse(row: Record<string, unknown>): Course {
  return {
    id: row.id as number,
    title: row.title as string,
    description: (row.description as string | null)?.trim() || null,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    is_published: Boolean(row.is_published),
    visibility: (row.visibility as CourseVisibility) ?? "public",
    owner_id: (row.owner_id as number | null) ?? null,
    rating_avg: Number(row.rating_avg) || 0,
    rating_count: Number(row.rating_count) || 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

const COURSE_COLUMNS =
  "id, title, description, thumbnail_url, is_published, visibility, owner_id, rating_avg, rating_count, created_at, updated_at";

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

  const withMeta = await attachCourseMeta(visible);
  const openIds = await getCourseIdsWithClasses(withMeta.map((course) => course.id));
  return withMeta.map((course) => ({
    ...course,
    registration_open: openIds.has(course.id),
  }));
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

export async function getCourseClasses(courseId: number): Promise<CourseClass[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_classes")
    .select(
      "id, course_id, registration_opens_on, registration_closes_on, learning_starts_at, created_at",
    )
    .eq("course_id", courseId)
    .order("learning_starts_at", { ascending: true });

  if (error) {
    console.error("Error fetching course classes:", error);
    return [];
  }

  return (data ?? []) as CourseClass[];
}

export async function getCourseIdsWithClasses(
  courseIds: number[],
): Promise<Set<number>> {
  const open = new Set<number>();
  if (courseIds.length === 0) return open;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_classes")
    .select(
      "course_id, registration_opens_on, registration_closes_on, learning_starts_at",
    )
    .in("course_id", courseIds);

  if (error) {
    console.error("Error fetching course classes:", error);
    return open;
  }

  for (const row of data ?? []) {
    const courseClass = row as Pick<
      CourseClass,
      | "registration_opens_on"
      | "registration_closes_on"
      | "learning_starts_at"
    > & { course_id: number };
    if (
      isClassOpen({
        id: 0,
        course_id: courseClass.course_id,
        created_at: "",
        registration_opens_on: courseClass.registration_opens_on,
        registration_closes_on: courseClass.registration_closes_on,
        learning_starts_at: courseClass.learning_starts_at,
      })
    ) {
      open.add(courseClass.course_id);
    }
  }

  return open;
}

export async function getCourseContents(
  courseId: number,
  classId?: number | null,
): Promise<CourseContent[]> {
  if (classId === null) return [];

  const supabase = await createClient();
  let query = supabase
    .from("course_contents")
    .select(
      "id, course_id, class_id, type, title, author, content_url, order_sequence, duration_unit, duration_amount, start_date, end_date, metadata",
    )
    .eq("course_id", courseId)
    .order("order_sequence", { ascending: true })
    .order("id", { ascending: true });

  if (classId != null) query = query.eq("class_id", classId);

  const { data, error } = await query;

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
      "id, course_id, class_id, type, title, author, content_url, order_sequence, duration_unit, duration_amount, start_date, end_date, metadata",
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
      "id, content_id, question_text, question_type, options, correct_option_id, correct_option_ids, allow_multiple, is_optional, points, order_sequence",
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

export type LearnerExamQuestion = Omit<
  ExamQuestion,
  "correct_option_id" | "correct_option_ids"
>;

/** Public exam view: strip correct answers. */
export async function getExamQuestionsForLearner(
  contentId: number,
): Promise<LearnerExamQuestion[]> {
  const questions = await getExamQuestions(contentId);
  return questions.map(
    ({ correct_option_id: _c, correct_option_ids: _ids, ...rest }) => rest,
  );
}

function mapEnrollmentRow(data: Record<string, unknown>): Enrollment {
  return {
    id: data.id as number,
    member_id: data.member_id as number,
    course_id: data.course_id as number,
    class_id: (data.class_id as number | null) ?? null,
    progress_percentage: Number(data.progress_percentage) || 0,
    status: data.status as Enrollment["status"],
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/** All enrollments for a member in a course (newest first). */
export async function getMemberCourseEnrollments(
  memberId: number,
  courseId: number,
): Promise<Enrollment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, member_id, course_id, class_id, progress_percentage, status, created_at, updated_at",
    )
    .eq("member_id", memberId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching course enrollments:", error);
    return [];
  }

  return (data ?? []).map((row) => mapEnrollmentRow(row as Record<string, unknown>));
}

export async function getEnrollmentForClass(
  memberId: number,
  classId: number,
): Promise<Enrollment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, member_id, course_id, class_id, progress_percentage, status, created_at, updated_at",
    )
    .eq("member_id", memberId)
    .eq("class_id", classId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching class enrollment:", error);
    return null;
  }

  return data ? mapEnrollmentRow(data as Record<string, unknown>) : null;
}

/**
 * Primary enrollment for learning/portal: prefer the open class if enrolled,
 * else an enrollment whose learning has started, else the newest.
 */
export async function getEnrollment(
  memberId: number,
  courseId: number,
): Promise<Enrollment | null> {
  const enrollments = await getMemberCourseEnrollments(memberId, courseId);
  if (enrollments.length === 0) return null;

  const classes = await getCourseClasses(courseId);
  const open = pickOpenClass(classes);
  if (open) {
    const inOpen = enrollments.find((item) => item.class_id === open.id);
    if (inOpen) return inOpen;
  }

  const started = enrollments.find((item) => {
    const courseClass = classes.find((entry) => entry.id === item.class_id);
    return (
      courseClass != null &&
      hasLearningStarted(courseClass.learning_starts_at)
    );
  });
  if (started) return started;

  return enrollments[0] ?? null;
}

export type MemberEnrollmentBrief = {
  courseId: number;
  learningStartsAt: string | null;
};

export async function getMemberEnrollmentBriefs(
  memberId: number,
): Promise<MemberEnrollmentBrief[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("course_id, course_classes ( learning_starts_at )")
    .eq("member_id", memberId);

  if (error) {
    console.error("Error fetching enrollments:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const classRaw = Array.isArray(row.course_classes)
      ? row.course_classes[0]
      : row.course_classes;
    return {
      courseId: row.course_id as number,
      learningStartsAt:
        (classRaw?.learning_starts_at as string | undefined) ?? null,
    };
  });
}

export type MemberLearningItem = {
  enrollment: Enrollment;
  course: {
    id: number;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
  };
  courseClass: CourseClass | null;
};

export async function getMemberLearning(
  memberId: number,
): Promise<MemberLearningItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, member_id, course_id, class_id, progress_percentage, status, created_at, updated_at, courses ( id, title, description, thumbnail_url ), course_classes ( id, course_id, registration_opens_on, registration_closes_on, learning_starts_at, created_at )",
    )
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching member learning:", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const courseRaw = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    if (!courseRaw) return [];
    const classRaw = Array.isArray(row.course_classes)
      ? row.course_classes[0]
      : row.course_classes;
    return [
      {
        enrollment: {
          id: row.id as number,
          member_id: row.member_id as number,
          course_id: row.course_id as number,
          class_id: (row.class_id as number | null) ?? null,
          progress_percentage: Number(row.progress_percentage) || 0,
          status: row.status as Enrollment["status"],
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
        },
        course: {
          id: courseRaw.id as number,
          title: courseRaw.title as string,
          description: (courseRaw.description as string | null) ?? null,
          thumbnail_url: (courseRaw.thumbnail_url as string | null) ?? null,
        },
        courseClass: classRaw
          ? {
              id: classRaw.id as number,
              course_id: classRaw.course_id as number,
              registration_opens_on: classRaw.registration_opens_on as string,
              registration_closes_on:
                (classRaw.registration_closes_on as string | null) ??
                (classRaw.registration_opens_on as string),
              learning_starts_at: classRaw.learning_starts_at as string,
              created_at: classRaw.created_at as string,
            }
          : null,
      },
    ];
  });
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
      "id, member_id, course_id, class_id, progress_percentage, status, created_at, updated_at, members ( id, name, email, phone, role, ft_connections ( login, avatar ), dc_connections ( username, avatar ), google_connections ( email, avatar ) )",
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

    const ftRaw = (member as { ft_connections?: unknown }).ft_connections;
    const dcRaw = (member as { dc_connections?: unknown }).dc_connections;
    const googleRaw = (member as { google_connections?: unknown })
      .google_connections;
    const ft = Array.isArray(ftRaw) ? ftRaw[0] : ftRaw;
    const dc = Array.isArray(dcRaw) ? dcRaw[0] : dcRaw;
    const google = Array.isArray(googleRaw) ? googleRaw[0] : googleRaw;
    const ftRow = ft as { login?: string | null; avatar?: string | null } | null;
    const dcRow = dc as {
      username?: string | null;
      avatar?: string | null;
    } | null;
    const googleRow = google as {
      email?: string | null;
      avatar?: string | null;
    } | null;

    return [
      {
        id: row.id as number,
        member_id: row.member_id as number,
        course_id: row.course_id as number,
        class_id: (row.class_id as number | null) ?? null,
        progress_percentage: Number(row.progress_percentage) || 0,
        status: row.status as CourseEnrollmentWithMember["status"],
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        member: {
          id: member.id as number,
          name: member.name as string,
          email: (member.email as string | null) ?? null,
          phone: (member.phone as string | null) ?? null,
          role: member.role as CourseEnrollmentWithMember["member"]["role"],
          avatar:
            ftRow?.avatar ?? dcRow?.avatar ?? googleRow?.avatar ?? null,
          login: ftRow?.login ?? null,
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


/** Submissions (answers + score/feedback) for an exam; optionally one enrollment. */
export async function getExamSubmissions(
  contentId: number,
  enrollmentId?: number,
): Promise<ExamSubmission[]> {
  const supabase = await createClient();

  let completionsQuery = supabase
    .from("content_completions")
    .select(
      "enrollment_id, exam_score, exam_feedback, exam_graded_at, completed_at",
    )
    .eq("content_id", contentId);
  let answersQuery = supabase
    .from("exam_answers")
    .select(
      "enrollment_id, question_id, selected_option_ids, answer_text, points_awarded, graded_at",
    )
    .eq("content_id", contentId);

  if (enrollmentId != null) {
    completionsQuery = completionsQuery.eq("enrollment_id", enrollmentId);
    answersQuery = answersQuery.eq("enrollment_id", enrollmentId);
  }

  const [completions, answers] = await Promise.all([
    completionsQuery.order("completed_at", { ascending: false }),
    answersQuery,
  ]);

  if (completions.error || answers.error) {
    console.error(
      "Error fetching exam submissions:",
      completions.error ?? answers.error,
    );
    return [];
  }

  const byEnrollment = new Map<number, ExamAnswerRecord[]>();
  for (const row of answers.data ?? []) {
    const list = byEnrollment.get(row.enrollment_id as number) ?? [];
    list.push({
      question_id: row.question_id as number,
      selected_option_ids: Array.isArray(row.selected_option_ids)
        ? (row.selected_option_ids as string[])
        : [],
      answer_text: (row.answer_text as string | null) ?? null,
      points_awarded:
        row.points_awarded == null ? null : Number(row.points_awarded),
      graded_at: (row.graded_at as string | null) ?? null,
    });
    byEnrollment.set(row.enrollment_id as number, list);
  }

  return (completions.data ?? []).map((row) => ({
    enrollment_id: row.enrollment_id as number,
    submitted_at: row.completed_at as string,
    score: row.exam_score == null ? null : Number(row.exam_score),
    feedback: (row.exam_feedback as string | null) ?? null,
    graded_at: (row.exam_graded_at as string | null) ?? null,
    answers: byEnrollment.get(row.enrollment_id as number) ?? [],
  }));
}
