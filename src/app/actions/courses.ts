"use server";

import {
  canAccessCourse,
  getAllCoursesForDashboard,
  getCompletedContentIds,
  getCourseAcl,
  getCourseById,
  getCourseContents,
  getEnrollment,
  getExamQuestions,
  getMyCourseRating,
  getPublishedCourses,
  replaceCourseAcl,
} from "@/lib/courses";
import type {
  CourseContentType,
  CourseEnrollmentStatus,
  CourseVisibility,
  CourseWithMeta,
  Enrollment,
  ExamOption,
  ExamQuestionType,
  VideoTimestamp,
} from "@/lib/course-types";
import { getMemberForSession, isMemberProfileComplete } from "@/lib/members";
import type { MemberRole } from "@/lib/member-role";
import { MEMBER_ROLE_ORDER } from "@/lib/member-role";
import { getSession } from "@/lib/session";
import { requireOwner } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidateCoursePaths(courseId?: number) {
  revalidatePath("/courses");
  revalidatePath("/dashboard/courses");
  if (courseId) {
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/learn`);
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
  await requireOwner();
  return getAllCoursesForDashboard();
}

export async function createCourse(formData: FormData): Promise<
  { success: true; id: number } | { success: false; error: string }
> {
  try {
    const { member } = await requireOwner();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const enrollment_status = (String(
      formData.get("enrollment_status") ?? "closed",
    ) || "closed") as CourseEnrollmentStatus;
    const is_published = formData.get("is_published") !== "false";
    const visibility = parseVisibility(formData.get("visibility"));
    const acl = parseAclFromForm(formData);
    const imageFile = formData.get("thumbnail");

    if (!title) return { success: false, error: "العنوان مطلوب" };
    if (!description) return { success: false, error: "الوصف مطلوب" };

    let thumbnail_url: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      thumbnail_url = await uploadCourseFile(imageFile, "thumbnails");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title,
        description,
        enrollment_status,
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
    await requireOwner();

    const id = Number(formData.get("id"));
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const enrollment_status = String(
      formData.get("enrollment_status") ?? "closed",
    ) as CourseEnrollmentStatus;
    const is_published = formData.get("is_published") !== "false";
    const visibility = parseVisibility(formData.get("visibility"));
    const acl = parseAclFromForm(formData);
    const imageFile = formData.get("thumbnail");

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };
    if (!title) return { success: false, error: "العنوان مطلوب" };
    if (!description) return { success: false, error: "الوصف مطلوب" };

    const payload: Record<string, unknown> = {
      title,
      description,
      enrollment_status,
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
    await requireOwner();
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
  content_url?: string | null;
  order_sequence?: number;
  timestamps?: VideoTimestamp[];
}): Promise<{ success: true; id: number } | { success: false; error: string }> {
  try {
    await requireOwner();

    const title = input.title.trim();
    const content_url = input.content_url?.trim() || null;
    if (!title) return { success: false, error: "عنوان الدرس مطلوب" };
    if (input.type !== "exam" && !content_url) {
      return { success: false, error: "رابط المحتوى مطلوب" };
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
          content_url,
          order_sequence: input.order_sequence ?? 0,
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

    const { data, error } = await supabase
      .from("course_contents")
      .insert({
        course_id: input.course_id,
        type: input.type,
        title,
        content_url,
        order_sequence: input.order_sequence ?? 0,
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

export async function deleteCourseContent(
  id: number,
  courseId: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();
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
  options: ExamOption[];
  correct_option_id: string;
  order_sequence?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();

    const question_text = input.question_text.trim();
    if (!question_text) return { success: false, error: "نص السؤال مطلوب" };
    if (!input.options.length)
      return { success: false, error: "خيارات الإجابة مطلوبة" };
    if (!input.correct_option_id)
      return { success: false, error: "الإجابة الصحيحة مطلوبة" };

    const supabase = await createClient();
    const payload = {
      content_id: input.content_id,
      question_text,
      question_type: input.question_type,
      options: input.options,
      correct_option_id: input.correct_option_id,
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
    await requireOwner();
    const supabase = await createClient();
    const { error } = await supabase.from("exam_questions").delete().eq("id", id);
    if (error) return { success: false, error: "تعذر حذف السؤال" };
    revalidateCoursePaths(courseId);
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
        error: "أكمل ملفك الشخصي (بانتظار موافقة المالك) قبل الالتحاق",
        code: "incomplete_profile",
      };
    }
    if (!isMemberProfileComplete(member)) {
      return {
        success: false,
        error: "أكمل ملفك الشخصي (بانتظار موافقة المالك) قبل الالتحاق",
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

    if (course.enrollment_status !== "open") {
      return {
        success: false,
        error: "التسجيل مغلق لهذه الدورة",
        code: "closed",
      };
    }

    const existing = await getEnrollment(member.id, courseId);
    if (existing) {
      return { success: true, enrollment: existing };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        member_id: member.id,
        course_id: courseId,
        progress_percentage: 0,
        status: "active",
      })
      .select(
        "id, member_id, course_id, progress_percentage, status, created_at, updated_at",
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
  const contents = await getCourseContents(courseId);
  const completed = await getCompletedContentIds(enrollmentId);
  const total = contents.length;
  const progress =
    total === 0 ? 0 : Math.round((completed.size / total) * 10000) / 100;

  const status = progress >= 100 ? "completed" : "active";
  const supabase = await createClient();
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

export async function submitExam(
  courseId: number,
  contentId: number,
  answers: Record<string, string>,
): Promise<
  | { success: true; score: number; passed: boolean; progress: number }
  | { success: false; error: string }
> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "غير مصرح" };

    const member = await getMemberForSession(session);
    if (!member) return { success: false, error: "يجب أن تكون عضواً في النادي" };

    const enrollment = await getEnrollment(member.id, courseId);
    if (!enrollment) return { success: false, error: "لست ملتحقاً بهذه الدورة" };

    const questions = await getExamQuestions(contentId);
    if (questions.length === 0) {
      return { success: false, error: "لا توجد أسئلة في هذا الاختبار" };
    }

    let correct = 0;
    for (const q of questions) {
      if (answers[String(q.id)] === q.correct_option_id) correct += 1;
    }

    const score = Math.round((correct / questions.length) * 10000) / 100;
    const passed = score >= 50;

    const supabase = await createClient();
    const { error } = await supabase.from("content_completions").upsert(
      {
        enrollment_id: enrollment.id,
        content_id: contentId,
        completed: passed,
        exam_score: score,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,content_id" },
    );

    if (error) {
      console.error("Error submitting exam:", error);
      return { success: false, error: "تعذر حفظ نتيجة الاختبار" };
    }

    const progress = await recalculateProgress(enrollment.id, courseId);
    revalidateCoursePaths(courseId);
    return { success: true, score, passed, progress };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
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
