import { redirect } from "next/navigation";

export default async function CourseLearnRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/portal/learning/${id}`);
}
