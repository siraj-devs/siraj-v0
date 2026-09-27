import { dashboardEntryPath, canOpenDashboardPath } from "@/lib/dashboard-access";
import { getMemberPagePermissions } from "@/lib/member-permissions";
import { canManageMembers, getMemberForSession } from "@/lib/members";
import type { DashboardPagePath } from "@/lib/page-permissions";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function gateDashboardPage(path: DashboardPagePath) {
  const session = await getSession();
  if (!session) redirect("/login");

  const member = await getMemberForSession(session);
  const permissions = member
    ? await getMemberPagePermissions(member.id)
    : [];

  if (!canOpenDashboardPath(member?.role, permissions, path)) {
    redirect(dashboardEntryPath(member?.role, permissions));
  }

  return {
    session,
    member,
    permissions,
    isOwner: canManageMembers(member?.role),
  };
}
