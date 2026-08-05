import { CourseLearnShell } from "@/components/courses/course-learn-shell";
import {
  getCompletedContentIds,
  getCourseById,
  getCourseContents,
  getEnrollment,
} from "@/lib/courses";
import {
  getMemberForSession,
  isMemberProfileComplete,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    const { id } = await params;
    redirect(`/login?next=/courses/${id}/learn`);
  }

  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const member = await getMemberForSession(session);
  if (!member) redirect(`/courses/${id}`);
  if (!isMemberProfileComplete(member)) {
    redirect(`/profile?next=/courses/${id}/learn`);
  }

  const course = await getCourseById(id);
  if (!course || !course.is_published) notFound();

  const enrollment = await getEnrollment(member.id, id);
  if (!enrollment) redirect(`/courses/${id}`);

  const contents = await getCourseContents(id);
  const completed = await getCompletedContentIds(enrollment.id);

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseLearnShell
        course={course}
        enrollment={enrollment}
        contents={contents}
        completedIds={[...completed]}
        activeContentId={null}
      >
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-kufam text-xl text-foreground">اختر درساً للبدء</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            استخدم القائمة الجانبية للتنقل بين محتوى الدورة.
          </p>
          {contents[0] && (
            <Link
              href={`/courses/${id}/learn/${contents[0].id}`}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              ابدأ من الدرس الأول
            </Link>
          )}
        </div>
      </CourseLearnShell>
    </div>
  );
}
