import { CourseLearnShell } from "@/components/courses/course-learn-shell";
import {
  getCompletedContentIds,
  getCourseById,
  getCourseContents,
  getEnrollment,
  getMyCourseRating,
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
  if (!member || !isMemberProfileComplete(member)) {
    redirect(`/profile?next=/courses/${id}/learn`);
  }

  const course = await getCourseById(id);
  if (!course || !course.is_published) notFound();

  const enrollment = await getEnrollment(member.id, id);
  if (!enrollment) redirect(`/courses/${id}`);
  // Enrolled learners keep learn access even if ACL changes later.

  const contents = await getCourseContents(id);
  const completed = await getCompletedContentIds(enrollment.id);
  const myRating = await getMyCourseRating(member.id, id);

  const resumeTarget =
    contents.find((item) => !completed.has(item.id)) ?? contents[0];

  return (
    <div className="py-10 pb-16 md:py-14">
      <CourseLearnShell
        course={course}
        enrollment={enrollment}
        contents={contents}
        completedIds={[...completed]}
        activeContentId={null}
        myRating={myRating}
      >
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-kufam text-xl text-foreground">اختر درساً للبدء</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            استخدم القائمة الجانبية للتنقل بين محتوى الدورة.
          </p>
          {resumeTarget && (
            <Link
              href={`/courses/${id}/learn/${resumeTarget.id}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              متابعة التعلم
            </Link>
          )}
        </div>
      </CourseLearnShell>
    </div>
  );
}
