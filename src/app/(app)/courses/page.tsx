import DecorativeLines from "@/components/DecorativeLines";
import { CoursesCatalog } from "@/components/courses/courses-catalog";
import { getPublishedCourses } from "@/lib/courses";

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="flex flex-col gap-10 py-10 pb-16 md:gap-14 md:py-14">
      <DecorativeLines
        eyebrow="تعلّم معنا"
        title="الدورات"
        description="تصفّح الدورات المنشورة. عرض التفاصيل والالتحاق يتطلب تسجيل الدخول وملفاً شخصياً مكتملاً."
      />
      <CoursesCatalog courses={courses} />
    </div>
  );
}
