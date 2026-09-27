import {
  getSessionsForDashboard,
  listSeries,
} from "@/app/actions/sessions";
import { SessionsManager } from "@/components/sessions/sessions-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";

export default async function DashboardSessionsPage() {
  const { canEdit } = await gateDashboardPage("/dashboard/sessions");

  const [sessions, series] = await Promise.all([
    getSessionsForDashboard(),
    listSeries(),
  ]);

  return (
    <div className="py-6 md:py-10">
      <SessionsManager sessions={sessions} series={series} canManage={canEdit} />
    </div>
  );
}
