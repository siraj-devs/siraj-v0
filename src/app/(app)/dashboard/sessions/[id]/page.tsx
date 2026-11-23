import { getSessionForDashboard } from "@/app/actions/sessions";
import { SessionDetail } from "@/components/sessions/session-detail";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { notFound } from "next/navigation";

export default async function DashboardSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await gateDashboardPage("/dashboard/sessions");

  const { id } = await params;
  const session = await getSessionForDashboard(id);
  if (!session) notFound();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6 md:py-10">
      <SessionDetail session={session} />
    </div>
  );
}
