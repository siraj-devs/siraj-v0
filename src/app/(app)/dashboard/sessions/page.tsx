import {
  getSessionsForDashboard,
  listSeries,
} from "@/app/actions/sessions";
import { SessionsManager } from "@/components/sessions/sessions-manager";
import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardSessionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getMemberForSession(session);
  const canManage = canManageMembers(current?.role);

  if (!canManage) redirect("/dashboard/members");

  const [sessions, series] = await Promise.all([
    getSessionsForDashboard(),
    listSeries(),
  ]);

  return (
    <div className="py-6 md:py-10">
      <SessionsManager
        sessions={sessions}
        series={series}
        canManage={canManage}
      />
    </div>
  );
}
