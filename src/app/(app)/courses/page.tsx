import DecorativeLines from "@/components/DecorativeLines";
import { CoursesCatalog } from "@/components/courses/courses-catalog";
import { getMemberEnrollmentBriefs, getPublishedCourses } from "@/lib/courses";
import { getMemberForSession } from "@/lib/members";
import { getSession } from "@/lib/session";

export default async function CoursesPage() {
  const session = await getSession();
  const member = session ? await getMemberForSession(session) : null;
  const [courses, enrollments] = await Promise.all([
    getPublishedCourses(member),
    member ? getMemberEnrollmentBriefs(member.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-10 py-10 pb-16 md:gap-14 md:py-14">
      <DecorativeLines
        eyebrow="الدورات"
        title="إبدأ رحلتك التعليمية مع سراج"
        description="تصفّح الدورات المنشورة. عرض التفاصيل والالتحاق يتطلب تسجيل الدخول وملفاً شخصياً مكتملاً."
      />
      <CoursesCatalog courses={courses} enrollments={enrollments} />
    </div>
  );
}
