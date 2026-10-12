import { redirect } from "next/navigation";

export default async function CourseLessonRedirect({
  params,
}: {
  params: Promise<{ id: string; contentId: string }>;
}) {
  const { id, contentId } = await params;
  redirect(`/portal/learning/${id}/${contentId}`);
}
