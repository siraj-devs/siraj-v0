import DecorativeLines from "@/components/DecorativeLines";
import { CoursesCatalog } from "@/components/courses/courses-catalog";
import { getEnrolledCourseIds, getPublishedCourses } from "@/lib/courses";
import { getMemberForSession } from "@/lib/members";
import { getSession } from "@/lib/session";

export default async function CoursesPage() {
  const [courses, session] = await Promise.all([
    getPublishedCourses(),
    getSession(),
  ]);

  const member = session ? await getMemberForSession(session) : null;
  const enrolledCourseIds = member ? await getEnrolledCourseIds(member.id) : [];

  return (
    <div className="flex flex-col gap-10 py-10 pb-16 md:gap-14 md:py-14">
      <DecorativeLines
        eyebrow="الدورات"
        title="إبدأ رحلتك التعليمية مع سراج"
        description="تصفّح الدورات المنشورة. عرض التفاصيل والالتحاق يتطلب تسجيل الدخول وملفاً شخصياً مكتملاً."
      />
      <CoursesCatalog
        courses={courses}
        enrolledCourseIds={enrolledCourseIds}
      />
    </div>
  );
}
