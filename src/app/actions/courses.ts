"use server";

import {
  canAccessCourse,
  getAllCoursesForDashboard,
  getCompletedContentIds,
  getCourseAcl,
  getCourseById,
  getCourseClasses,
  getCourseContentById,
  getCourseContents,
  getEnrollment,
  getEnrollmentForClass,
  getExamQuestions,
  getExamSubmissions,
  getMyCourseRating,
  getPublishedCourses,
  replaceCourseAcl,
} from "@/lib/courses";
import type {
  CourseContentType,
  CourseVisibility,
  CourseWithMeta,
  Enrollment,
  ExamOption,
  ExamQuestionType,
  VideoTimestamp,
} from "@/lib/course-types";
import {
  computeAutoPoints,
  computeExamScorePercent,
  isAutoGradableQuestion,
  isChoiceQuestionType,
  isTextQuestionType,
  needsManualGrade,
  type ExamQuestion,
} from "@/lib/course-types";
import { getMemberForSession, isMemberProfileComplete } from "@/lib/members";
import type { MemberRole } from "@/lib/member-role";
import { MEMBER_ROLE_ORDER } from "@/lib/member-role";
import { getSession } from "@/lib/session";
import { requirePageAccess, requirePageEdit } from "@/lib/auth-guards";
import {
  hasLearningStarted,
  hasLessonStarted,
  parseDateOnly,
  pickOpenClass,
  type DurationUnit,
} from "@/lib/course-schedule";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function learningBlockedReason(enrollment: Enrollment) {
  if (!enrollment.class_id) return "يبدأ التعلم في تاريخ بداية الدفعة";
  const classes = await getCourseClasses(enrollment.course_id);
  const courseClass = classes.find((item) => item.id === enrollment.class_id);
  if (!courseClass || !hasLearningStarted(courseClass.learning_starts_at)) {
    return "يبدأ التعلم في تاريخ بداية الدفعة";
  }
  return null;
}

function revalidateCoursePaths(courseId?: number) {
  revalidatePath("/courses");
  revalidatePath("/dashboard/courses");
  if (courseId) {
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/portal/learning`);
    revalidatePath(`/portal/learning/${courseId}`);
    revalidatePath(`/dashboard/courses/${courseId}`);
  }
}

function parseVisibility(value: FormDataEntryValue | null): CourseVisibility {
  return value === "private" ? "private" : "public";
}

function parseAclFromForm(formData: FormData) {
  const roles = formData
    .getAll("allowed_roles")
    .map((v) => String(v))
    .filter((role): role is MemberRole =>
      (MEMBER_ROLE_ORDER as readonly string[]).includes(role),
    );
  const memberIds = formData
    .getAll("allowed_member_ids")
    .map((v) => Number(v))
    .filter((id) => Number.isFinite(id) && id > 0);
  return { roles, memberIds };
}

async function uploadCourseFile(
  file: File,
  folder: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("courses").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    console.error("Error uploading course file:", error);
    throw new Error("تعذر رفع الملف");
  }

  const { data } = supabase.storage.from("courses").getPublicUrl(path);
  return data.publicUrl;
}

export async function listPublishedCourses() {
  return getPublishedCourses();
}

export async function listCoursesForDashboard(): Promise<CourseWithMeta[]> {
  await requirePageAccess("/dashboard/courses");
  return getAllCoursesForDashboard();
}

export async function createCourse(formData: FormData): Promise<
  { success: true; id: number } | { success: false; error: string }
> {
  try {
    const { member } = await requirePageEdit("/dashboard/courses");

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const is_published = formData.get("is_published") !== "false";
    const visibility = parseVisibility(formData.get("visibility"));
    const acl = parseAclFromForm(formData);
    const imageFile = formData.get("thumbnail");

    if (!title) return { success: false, error: "العنوان مطلوب" };

    let thumbnail_url: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      thumbnail_url = await uploadCourseFile(imageFile, "thumbnails");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title,
        description: description || null,
        is_published,
        visibility,
        owner_id: member.id,
        thumbnail_url,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error creating course:", error);
      return { success: false, error: "تعذر إنشاء الدورة" };
    }

    if (visibility === "private") {
      const aclResult = await replaceCourseAcl(data.id, acl);
      if (!aclResult.success) return aclResult;
    }

    revalidateCoursePaths(data.id);
    return { success: true, id: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function updateCourse(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    await requirePageEdit("/dashboard/courses");

    const id = Number(formData.get("id"));
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const is_published = formData.get("is_published") !== "false";
    const visibility = parseVisibility(formData.get("visibility"));
    const acl = parseAclFromForm(formData);
    const imageFile = formData.get("thumbnail");

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };
    if (!title) return { success: false, error: "العنوان مطلوب" };

    const payload: Record<string, unknown> = {
      title,
      description: description || null,
      is_published,
      visibility,
      updated_at: new Date().toISOString(),
    };

    if (imageFile instanceof File && imageFile.size > 0) {
      payload.thumbnail_url = await uploadCourseFile(imageFile, "thumbnails");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("courses").update(payload).eq("id", id);

    if (error) {
      console.error("Error updating course:", error);
      return { success: false, error: "تعذر تحديث الدورة" };
    }

    const aclResult = await replaceCourseAcl(
      id,
      visibility === "private" ? acl : { roles: [], memberIds: [] },
    );
    if (!aclResult.success) return aclResult;

    revalidateCoursePaths(id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function deleteCourse(
  id: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");
    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting course:", error);
      return { success: false, error: "تعذر حذف الدورة" };
    }

    revalidateCoursePaths(id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function upsertCourseContent(input: {
  id?: number;
  course_id: number;
  type: CourseContentType;
  title: string;
  author?: string | null;
  content_url?: string | null;
  order_sequence?: number;
  duration_unit?: DurationUnit | null;
  duration_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  timestamps?: VideoTimestamp[];
  class_id?: number;
}): Promise<{ success: true; id: number } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");

    const title = input.title.trim();
    const author = input.author?.trim() || null;
    const content_url = input.content_url?.trim() || null;
    const duration_unit = input.duration_unit ?? null;
    const duration_amount =
      duration_unit && input.duration_amount && input.duration_amount > 0
        ? Math.floor(input.duration_amount)
        : null;
    const startRaw = input.start_date?.trim() || "";
    const endRaw = input.end_date?.trim() || "";
    const start_date = startRaw ? parseDateOnly(startRaw) : null;
    const end_date = endRaw ? parseDateOnly(endRaw) : null;

    if (!title) return { success: false, error: "عنوان الدرس مطلوب" };
    if (input.type !== "exam" && !content_url) {
      return { success: false, error: "رابط المحتوى مطلوب" };
    }
    if (duration_unit && !duration_amount) {
      return { success: false, error: "أدخل مدة الدرس" };
    }
    if (startRaw && !start_date) {
      return { success: false, error: "تاريخ بداية الدرس غير صالح" };
    }
    if (endRaw && !end_date) {
      return { success: false, error: "تاريخ نهاية الدرس غير صالح" };
    }
    if (start_date && end_date && start_date > end_date) {
      return {
        success: false,
        error: "تاريخ بداية الدرس يجب أن يسبق تاريخ النهاية أو يساويه",
      };
    }

    const metadata =
      input.type === "watching"
        ? { timestamps: input.timestamps ?? [] }
        : {};

    const supabase = await createClient();
    if (input.id) {
      const { error } = await supabase
        .from("course_contents")
        .update({
          type: input.type,
          title,
          author,
          content_url,
          order_sequence: input.order_sequence ?? 0,
          duration_unit: duration_amount ? duration_unit : null,
          duration_amount,
          start_date,
          end_date,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);

      if (error) {
        console.error("Error updating content:", error);
        return { success: false, error: "تعذر تحديث الدرس" };
      }
      revalidateCoursePaths(input.course_id);
      return { success: true, id: input.id };
    }

    if (!input.class_id) {
      return { success: false, error: "اختر الدفعة التي ينتمي إليها الدرس" };
    }

    const { data, error } = await supabase
      .from("course_contents")
      .insert({
        course_id: input.course_id,
        class_id: input.class_id,
        type: input.type,
        title,
        author,
        content_url,
        order_sequence: input.order_sequence ?? 0,
        duration_unit: duration_amount ? duration_unit : null,
        duration_amount,
        start_date,
        end_date,
        metadata,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error creating content:", error);
      return { success: false, error: "تعذر إضافة الدرس" };
    }

    revalidateCoursePaths(input.course_id);
    return { success: true, id: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function reorderCourseContents(input: {
  course_id: number;
  class_id: number;
  ordered_ids: number[];
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");

    const ordered_ids = input.ordered_ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (ordered_ids.length === 0) {
      return { success: false, error: "لا دروس لإعادة الترتيب" };
    }

    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("course_contents")
      .select("id")
      .eq("course_id", input.course_id)
      .eq("class_id", input.class_id);

    if (fetchError) {
      console.error("Error loading course contents for reorder:", fetchError);
      return { success: false, error: "تعذر تحديث ترتيب الدروس" };
    }

    const existingIds = new Set((existing ?? []).map((row) => Number(row.id)));
    if (
      ordered_ids.length !== existingIds.size ||
      ordered_ids.some((id) => !existingIds.has(id))
    ) {
      return { success: false, error: "ترتيب الدروس غير صالح" };
    }

    const updates = await Promise.all(
      ordered_ids.map((id, index) =>
        supabase
          .from("course_contents")
          .update({
            order_sequence: index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("course_id", input.course_id)
          .eq("class_id", input.class_id),
      ),
    );

    if (updates.some((result) => result.error)) {
      console.error(
        "Error reordering course contents:",
        updates.find((result) => result.error)?.error,
      );
      return { success: false, error: "تعذر تحديث ترتيب الدروس" };
    }

    revalidateCoursePaths(input.course_id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteCourseContent(
  id: number,
  courseId: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");
    const supabase = await createClient();
    const { error } = await supabase.from("course_contents").delete().eq("id", id);
    if (error) {
      console.error("Error deleting content:", error);
      return { success: false, error: "تعذر حذف الدرس" };
    }
    revalidateCoursePaths(courseId);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function upsertExamQuestion(input: {
  id?: number;
  content_id: number;
  course_id: number;
  question_text: string;
  question_type: ExamQuestionType;
  options?: ExamOption[];
  correct_option_ids?: string[];
  allow_multiple?: boolean;
  is_optional?: boolean;
  points?: number;
  order_sequence?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");

    const question_text = input.question_text.trim();
    if (!question_text) return { success: false, error: "نص السؤال مطلوب" };

    const parsedPoints = Number(input.points);
    const points = Number.isFinite(parsedPoints)
      ? Math.max(0, Math.floor(parsedPoints))
      : 1;
    const choice = isChoiceQuestionType(input.question_type);
    const text = isTextQuestionType(input.question_type);
    if (!choice && !text) {
      return { success: false, error: "نوع السؤال غير صالح" };
    }

    const options = choice
      ? (input.options ?? []).filter((o) => o.text.trim())
      : [];
    if (choice && options.length < 2) {
      return { success: false, error: "خيارات الإجابة مطلوبة" };
    }

    const optionIds = new Set(options.map((o) => o.id));
    let correct_option_ids = (input.correct_option_ids ?? []).filter((id) =>
      optionIds.has(id),
    );

    const allow_multiple =
      input.question_type === "multiple_choice" &&
      (Boolean(input.allow_multiple) || correct_option_ids.length > 1);

    if (input.question_type === "true_false" && correct_option_ids.length > 1) {
      correct_option_ids = correct_option_ids.slice(0, 1);
    }

    if (
      !allow_multiple &&
      input.question_type === "multiple_choice" &&
      correct_option_ids.length > 1
    ) {
      correct_option_ids = correct_option_ids.slice(0, 1);
    }

    const supabase = await createClient();
    const payload = {
      content_id: input.content_id,
      question_text,
      question_type: input.question_type,
      options,
      correct_option_id: correct_option_ids[0] ?? null,
      correct_option_ids,
      allow_multiple,
      is_optional: Boolean(input.is_optional),
      points,
      order_sequence: input.order_sequence ?? 0,
    };

    const { error } = input.id
      ? await supabase.from("exam_questions").update(payload).eq("id", input.id)
      : await supabase.from("exam_questions").insert(payload);

    if (error) {
      console.error("Error saving exam question:", error);
      return { success: false, error: "تعذر حفظ السؤال" };
    }

    revalidateCoursePaths(input.course_id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteExamQuestion(
  id: number,
  courseId: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");
    const supabase = await createClient();
    const { error } = await supabase.from("exam_questions").delete().eq("id", id);
    if (error) return { success: false, error: "تعذر حذف السؤال" };
    revalidateCoursePaths(courseId);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function reorderExamQuestions(input: {
  course_id: number;
  content_id: number;
  ordered_ids: number[];
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");

    const ordered_ids = input.ordered_ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (ordered_ids.length === 0) {
      return { success: false, error: "لا أسئلة لإعادة الترتيب" };
    }

    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("exam_questions")
      .select("id")
      .eq("content_id", input.content_id);

    if (fetchError) {
      console.error("Error loading exam questions for reorder:", fetchError);
      return { success: false, error: "تعذر تحديث ترتيب الأسئلة" };
    }

    const existingIds = new Set((existing ?? []).map((row) => Number(row.id)));
    if (
      ordered_ids.length !== existingIds.size ||
      ordered_ids.some((id) => !existingIds.has(id))
    ) {
      return { success: false, error: "ترتيب الأسئلة غير صالح" };
    }

    const updates = await Promise.all(
      ordered_ids.map((id, index) =>
        supabase
          .from("exam_questions")
          .update({ order_sequence: index })
          .eq("id", id)
          .eq("content_id", input.content_id),
      ),
    );

    if (updates.some((result) => result.error)) {
      console.error(
        "Error reordering exam questions:",
        updates.find((result) => result.error)?.error,
      );
      return { success: false, error: "تعذر تحديث ترتيب الأسئلة" };
    }

    revalidateCoursePaths(input.course_id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function enrollInCourse(
  courseId: number,
): Promise<
  | { success: true; enrollment: Enrollment }
  | {
      success: false;
      error: string;
      code?:
        | "unauthenticated"
        | "not_member"
        | "incomplete_profile"
        | "closed"
        | "unpublished"
        | "forbidden";
    }
> {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: "يجب تسجيل الدخول أولاً",
        code: "unauthenticated",
      };
    }

    const member = await getMemberForSession(session);
    if (!member) {
      return {
        success: false,
        error: "أكمل ملفك الشخصي قبل الالتحاق",
        code: "incomplete_profile",
      };
    }
    if (!isMemberProfileComplete(member)) {
      return {
        success: false,
        error: "أكمل ملفك الشخصي قبل الالتحاق",
        code: "incomplete_profile",
      };
    }

    const course = await getCourseById(courseId);
    if (!course || !course.is_published) {
      return {
        success: false,
        error: "الدورة غير متاحة",
        code: "unpublished",
      };
    }

    const acl = await getCourseAcl(courseId);
    if (!canAccessCourse(course, member, acl)) {
      return {
        success: false,
        error: "ليست لديك صلاحية للالتحاق بهذه الدورة",
        code: "forbidden",
      };
    }

    const classes = await getCourseClasses(courseId);
    const joinClass = pickOpenClass(classes);
    if (!joinClass) {
      return {
        success: false,
        error: "لا توجد دفعة للالتحاق حالياً",
        code: "closed",
      };
    }

    const existingInClass = await getEnrollmentForClass(
      member.id,
      joinClass.id,
    );
    if (existingInClass) {
      return { success: true, enrollment: existingInClass };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        member_id: member.id,
        course_id: courseId,
        class_id: joinClass.id,
        progress_percentage: 0,
        status: "active",
      })
      .select(
        "id, member_id, course_id, class_id, progress_percentage, status, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      console.error("Error enrolling:", error);
      return { success: false, error: "تعذر الالتحاق بالدورة" };
    }

    revalidateCoursePaths(courseId);
    return {
      success: true,
      enrollment: {
        ...(data as Enrollment),
        class_id: (data.class_id as number | null) ?? joinClass.id,
        progress_percentage: Number(data.progress_percentage) || 0,
      },
    };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function unenrollFromCourse(
  courseId: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "غير مصرح" };

    const member = await getMemberForSession(session);
    if (!member) return { success: false, error: "يجب أن تكون عضواً في النادي" };

    const enrollment = await getEnrollment(member.id, courseId);
    if (!enrollment) {
      return { success: false, error: "لست ملتحقاً بهذه الدورة" };
    }

    if (enrollment.class_id) {
      const classes = await getCourseClasses(courseId);
      const courseClass = classes.find((item) => item.id === enrollment.class_id);
      if (courseClass && hasLearningStarted(courseClass.learning_starts_at)) {
        return {
          success: false,
          error: "لا يمكن إلغاء الالتحاق بعد بداية التعلم",
        };
      }
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", enrollment.id)
      .eq("member_id", member.id);

    if (error) {
      console.error("Error unenrolling from course:", error);
      return { success: false, error: "تعذر إلغاء الالتحاق بالدورة" };
    }

    revalidateCoursePaths(courseId);
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

async function recalculateProgress(enrollmentId: number, courseId: number) {
  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("class_id")
    .eq("id", enrollmentId)
    .maybeSingle();
  const contents = await getCourseContents(
    courseId,
    (enrollment?.class_id as number | null) ?? null,
  );
  const completed = await getCompletedContentIds(enrollmentId);
  const total = contents.length;
  const progress =
    total === 0 ? 0 : Math.round((completed.size / total) * 10000) / 100;

  const status = progress >= 100 ? "completed" : "active";
  await supabase
    .from("enrollments")
    .update({
      progress_percentage: progress,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  return progress;
}

export async function markContentComplete(
  courseId: number,
  contentId: number,
): Promise<{ success: true; progress: number } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "غير مصرح" };

    const member = await getMemberForSession(session);
    if (!member) return { success: false, error: "يجب أن تكون عضواً في النادي" };

    const enrollment = await getEnrollment(member.id, courseId);
    if (!enrollment) return { success: false, error: "لست ملتحقاً بهذه الدورة" };

    const content = await getCourseContentById(contentId);
    if (!content || content.class_id !== enrollment.class_id) {
      return { success: false, error: "هذا الدرس لا ينتمي إلى دفعتك" };
    }
    if (content.type === "exam") {
      return {
        success: false,
        error: "يُكمل التقويم بعد التقييم، وليس يدوياً",
      };
    }
    const blocked = await learningBlockedReason(enrollment);
    if (blocked) return { success: false, error: blocked };
    if (!hasLessonStarted(content)) {
      return { success: false, error: "هذا الدرس لم يبدأ بعد" };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("content_completions").upsert(
      {
        enrollment_id: enrollment.id,
        content_id: contentId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,content_id" },
    );

    if (error) {
      console.error("Error marking complete:", error);
      return { success: false, error: "تعذر تحديث التقدم" };
    }

    const progress = await recalculateProgress(enrollment.id, courseId);
    revalidateCoursePaths(courseId);
    return { success: true, progress };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

export type ExamAnswerPayload = {
  selected_option_ids?: string[];
  answer_text?: string;
};

export async function submitExam(
  courseId: number,
  contentId: number,
  answers: Record<string, ExamAnswerPayload>,
): Promise<
  | { success: true; progress: number; graded: boolean }
  | { success: false; error: string }
> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "غير مصرح" };

    const member = await getMemberForSession(session);
    if (!member) return { success: false, error: "يجب أن تكون عضواً في النادي" };

    const enrollment = await getEnrollment(member.id, courseId);
    if (!enrollment) return { success: false, error: "لست ملتحقاً بهذه الدورة" };

    const content = await getCourseContentById(contentId);
    if (!content || content.class_id !== enrollment.class_id) {
      return { success: false, error: "هذا التقويم لا ينتمي إلى دفعتك" };
    }

    const previous = await getExamSubmissions(contentId, enrollment.id);
    if (previous.length > 0) {
      return { success: false, error: "سبق أن أرسلت إجاباتك على هذا التقويم" };
    }
    const blocked = await learningBlockedReason(enrollment);
    if (blocked) return { success: false, error: blocked };
    if (!hasLessonStarted(content)) {
      return { success: false, error: "هذا التقويم لم يبدأ بعد" };
    }

    const questions = await getExamQuestions(contentId);
    if (questions.length === 0) {
      return { success: false, error: "لا توجد أسئلة في هذا التقويم" };
    }

    const now = new Date().toISOString();
    const answerRows: {
      enrollment_id: number;
      content_id: number;
      question_id: number;
      answer_text: string | null;
      selected_option_ids: string[];
      points_awarded: number | null;
      graded_at: string | null;
      updated_at: string;
    }[] = [];

    let needsManual = false;

    for (const q of questions) {
      const raw = answers[String(q.id)];
      const optionIds = new Set(q.options.map((o) => o.id));
      const selected = (raw?.selected_option_ids ?? []).filter((id) =>
        optionIds.has(id),
      );
      const answerText = (raw?.answer_text ?? "").trim();

      const hasChoiceAnswer =
        isChoiceQuestionType(q.question_type) && selected.length > 0;
      const hasTextAnswer =
        isTextQuestionType(q.question_type) && Boolean(answerText);
      const answered = hasChoiceAnswer || hasTextAnswer;

      if (!answered) {
        if (q.is_optional) continue;
        return {
          success: false,
          error: "أجب عن جميع الأسئلة المطلوبة قبل الإرسال",
        };
      }

      if (
        isChoiceQuestionType(q.question_type) &&
        !q.allow_multiple &&
        selected.length > 1
      ) {
        return { success: false, error: "اختر إجابة واحدة فقط لبعض الأسئلة" };
      }

      const auto = isAutoGradableQuestion(q);
      const manual = needsManualGrade(q);
      // Zero-point answers need no teacher grade.
      const points_awarded = auto
        ? computeAutoPoints(q, selected)
        : q.points <= 0
          ? 0
          : null;
      if (manual) needsManual = true;

      answerRows.push({
        enrollment_id: enrollment.id,
        content_id: contentId,
        question_id: q.id,
        answer_text: isTextQuestionType(q.question_type) ? answerText : null,
        selected_option_ids: isChoiceQuestionType(q.question_type)
          ? selected
          : [],
        points_awarded,
        graded_at: auto || q.points <= 0 ? now : null,
        updated_at: now,
      });
    }

    const score = needsManual
      ? null
      : computeExamScorePercent(
          questions,
          answerRows.map((row) => ({
            question_id: row.question_id,
            points_awarded: row.points_awarded,
          })),
        );

    const supabase = await createClient();
    const { error: answersError } = await supabase
      .from("exam_answers")
      .insert(answerRows);

    if (answersError) {
      console.error("Error saving exam answers:", answersError);
      return { success: false, error: "تعذر حفظ إجابات التقويم" };
    }

    // Lesson counts as completed only once the exam is graded.
    const graded = !needsManual;
    const { error } = await supabase.from("content_completions").upsert(
      {
        enrollment_id: enrollment.id,
        content_id: contentId,
        completed: graded,
        exam_score: score,
        exam_feedback: null,
        exam_graded_at: graded ? now : null,
        completed_at: now,
      },
      { onConflict: "enrollment_id,content_id" },
    );

    if (error) {
      console.error("Error submitting exam:", error);
      return { success: false, error: "تعذر حفظ نتيجة التقويم" };
    }

    const progress = await recalculateProgress(enrollment.id, courseId);
    revalidateCoursePaths(courseId);
    return { success: true, progress, graded };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

async function recomputeExamScore(
  contentId: number,
  enrollmentId: number,
  questions: ExamQuestion[],
) {
  const submissions = await getExamSubmissions(contentId, enrollmentId);
  const submission = submissions[0];
  if (!submission) return null;
  return computeExamScorePercent(questions, submission.answers);
}

export async function gradeExamAnswer(input: {
  course_id: number;
  content_id: number;
  enrollment_id: number;
  question_id: number;
  points: number;
}): Promise<{ success: true; score: number | null } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");

    const questions = await getExamQuestions(input.content_id);
    const question = questions.find((q) => q.id === input.question_id);
    if (!question || question.content_id !== input.content_id) {
      return { success: false, error: "السؤال غير موجود" };
    }
    if (isAutoGradableQuestion(question)) {
      return { success: false, error: "هذا السؤال يُصحَّح تلقائياً" };
    }
    if (question.points <= 0) {
      return { success: false, error: "هذا السؤال بلا نقاط ولا يحتاج تصحيحاً" };
    }

    const parsed = Number(input.points);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { success: false, error: "درجة غير صالحة" };
    }
    const points = Math.min(
      question.points,
      Math.round(parsed * 100) / 100,
    );

    const supabase = await createClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("exam_answers")
      .update({
        points_awarded: points,
        graded_at: now,
        updated_at: now,
      })
      .eq("enrollment_id", input.enrollment_id)
      .eq("question_id", input.question_id);

    if (error) {
      console.error("Error grading exam answer:", error);
      return { success: false, error: "تعذر حفظ الدرجة" };
    }

    // Re-grading unpublishes the result until the teacher publishes again.
    await supabase
      .from("content_completions")
      .update({
        exam_graded_at: null,
        exam_score: null,
        completed: false,
      })
      .eq("enrollment_id", input.enrollment_id)
      .eq("content_id", input.content_id);

    await recalculateProgress(input.enrollment_id, input.course_id);

    const score = await recomputeExamScore(
      input.content_id,
      input.enrollment_id,
      questions,
    );

    revalidateCoursePaths(input.course_id);
    revalidatePath(
      `/dashboard/courses/${input.course_id}/exams/${input.content_id}`,
    );
    return { success: true, score };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function publishExamGrade(input: {
  course_id: number;
  content_id: number;
  enrollment_id: number;
  feedback?: string;
}): Promise<
  | { success: true; score: number | null }
  | { success: false; error: string }
> {
  try {
    await requirePageEdit("/dashboard/courses");

    const questions = await getExamQuestions(input.content_id);
    const submissions = await getExamSubmissions(
      input.content_id,
      input.enrollment_id,
    );
    const submission = submissions[0];
    if (!submission) {
      return { success: false, error: "لا يوجد تسليم لهذا العضو" };
    }

    const pending = submission.answers.filter((answer) => {
      const question = questions.find((q) => q.id === answer.question_id);
      if (!question) return false;
      return needsManualGrade(question) && answer.points_awarded == null;
    });
    if (pending.length > 0) {
      return {
        success: false,
        error: "أكمل تصحيح جميع الإجابات قبل النشر",
      };
    }

    const score = computeExamScorePercent(questions, submission.answers);
    const feedback = (input.feedback ?? "").trim() || null;
    const now = new Date().toISOString();

    const supabase = await createClient();
    const { error } = await supabase
      .from("content_completions")
      .update({
        exam_score: score,
        exam_feedback: feedback,
        exam_graded_at: now,
        completed: true,
      })
      .eq("enrollment_id", input.enrollment_id)
      .eq("content_id", input.content_id);

    if (error) {
      console.error("Error publishing exam grade:", error);
      return { success: false, error: "تعذر نشر النتيجة" };
    }

    await recalculateProgress(input.enrollment_id, input.course_id);

    revalidateCoursePaths(input.course_id);
    revalidatePath(
      `/dashboard/courses/${input.course_id}/exams/${input.content_id}`,
    );
    revalidatePath(`/portal/learning/${input.course_id}/${input.content_id}`);
    return { success: true, score };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function rateCourse(
  courseId: number,
  rating: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: "التقييم يجب أن يكون بين 1 و 5" };
    }

    const session = await getSession();
    if (!session) return { success: false, error: "غير مصرح" };

    const member = await getMemberForSession(session);
    if (!member) return { success: false, error: "يجب أن تكون عضواً في النادي" };

    const enrollment = await getEnrollment(member.id, courseId);
    if (!enrollment) return { success: false, error: "لست ملتحقاً بهذه الدورة" };

    const existing = await getMyCourseRating(member.id, courseId);
    if (existing !== null) {
      return { success: false, error: "لقد قيّمت هذه الدورة مسبقاً" };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("course_ratings").upsert(
      {
        course_id: courseId,
        member_id: member.id,
        rating,
      },
      { onConflict: "course_id,member_id" },
    );

    if (error) {
      console.error("Error rating course:", error);
      return { success: false, error: "تعذر حفظ التقييم" };
    }

    const { data: ratings } = await supabase
      .from("course_ratings")
      .select("rating")
      .eq("course_id", courseId);

    const list = ratings ?? [];
    const avg =
      list.length === 0
        ? 0
        : list.reduce((sum, r) => sum + r.rating, 0) / list.length;

    await supabase
      .from("courses")
      .update({
        rating_avg: Math.round(avg * 100) / 100,
        rating_count: list.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);

    revalidateCoursePaths(courseId);
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

function parseClassWindow(input: {
  registration_opens_on: string;
  registration_closes_on: string;
  learning_starts_at: string;
}):
  | {
      ok: true;
      registrationOpensOn: string;
      registrationClosesOn: string;
      learningStartsAt: string;
    }
  | { ok: false; error: string } {
  const registrationOpensOn = parseDateOnly(input.registration_opens_on);
  const registrationClosesOn = parseDateOnly(input.registration_closes_on);
  const learningStartsAt = parseDateOnly(input.learning_starts_at);
  if (!registrationOpensOn) {
    return { ok: false, error: "تاريخ فتح التسجيل غير صالح" };
  }
  if (!registrationClosesOn) {
    return { ok: false, error: "تاريخ إغلاق التسجيل غير صالح" };
  }
  if (!learningStartsAt) {
    return { ok: false, error: "تاريخ بداية التعلم غير صالح" };
  }
  if (registrationOpensOn > registrationClosesOn) {
    return {
      ok: false,
      error: "تاريخ فتح التسجيل يجب أن يسبق تاريخ الإغلاق أو يساويه",
    };
  }
  return {
    ok: true,
    registrationOpensOn,
    registrationClosesOn,
    learningStartsAt,
  };
}

export async function createCourseClass(input: {
  course_id: number;
  registration_opens_on: string;
  registration_closes_on: string;
  learning_starts_at: string;
}): Promise<{ success: true; id: number } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");

    const dates = parseClassWindow(input);
    if (!dates.ok) return { success: false, error: dates.error };
    const { registrationOpensOn, registrationClosesOn, learningStartsAt } =
      dates;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_classes")
      .insert({
        course_id: input.course_id,
        registration_opens_on: registrationOpensOn,
        registration_closes_on: registrationClosesOn,
        learning_starts_at: learningStartsAt,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error creating course class:", error);
      return { success: false, error: "تعذر فتح الدفعة" };
    }

    revalidateCoursePaths(input.course_id);
    return { success: true, id: data.id as number };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function updateCourseClass(input: {
  id: number;
  course_id: number;
  registration_opens_on: string;
  registration_closes_on: string;
  learning_starts_at: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");

    const dates = parseClassWindow(input);
    if (!dates.ok) return { success: false, error: dates.error };
    const { registrationOpensOn, registrationClosesOn, learningStartsAt } =
      dates;

    const supabase = await createClient();
    const { error } = await supabase
      .from("course_classes")
      .update({
        registration_opens_on: registrationOpensOn,
        registration_closes_on: registrationClosesOn,
        learning_starts_at: learningStartsAt,
      })
      .eq("id", input.id)
      .eq("course_id", input.course_id);

    if (error) {
      console.error("Error updating course class:", error);
      return { success: false, error: "تعذر تعديل الدفعة" };
    }

    revalidateCoursePaths(input.course_id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteCourseClass(
  id: number,
  courseId: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/courses");
    const supabase = await createClient();
    const { error } = await supabase.from("course_classes").delete().eq("id", id);
    if (error) {
      console.error("Error deleting course class:", error);
      return { success: false, error: "تعذر حذف الدفعة" };
    }
    revalidateCoursePaths(courseId);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
