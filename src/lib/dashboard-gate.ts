import { dashboardEntryPath, canOpenDashboardPath } from "@/lib/dashboard-access";
import { canManageGames, type GamesPermission } from "@/lib/games-access";
import { getMemberPagePermissions } from "@/lib/member-permissions";
import { canManageMembers, getMemberForSession } from "@/lib/members";
import { hasPageEdit, type DashboardPagePath } from "@/lib/page-permissions";
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

  const isOwner = canManageMembers(member?.role);

  return {
    session,
    member,
    permissions,
    isOwner,
    canEdit: isOwner || hasPageEdit(permissions, path),
  };
}

/** Game template pages: redirects unless `canManageGames` allows `permission`. */
export async function gateGamesPage(permission: GamesPermission) {
  const session = await getSession();
  if (!session) redirect("/login");

  const member = await getMemberForSession(session);
  const permissions = member
    ? await getMemberPagePermissions(member.id)
    : [];

  if (!member || !canManageGames(member, permissions, permission)) {
    redirect(dashboardEntryPath(member?.role, permissions));
  }

  return {
    session,
    member,
    canManage: canManageGames(member, permissions, "games.manage"),
  };
}
