import { getMemberPagePermissions } from "@/lib/member-permissions";
import {
  canAccessDashboard,
  canManageMembers,
  getMemberForSession,
  type AppMember,
} from "@/lib/members";
import {
  hasPagePermission,
  type DashboardPagePath,
} from "@/lib/page-permissions";
import { getSession } from "@/lib/session";

/**
 * Shared server-action guards. Throws a generic Arabic "unauthorized" error
 * (never leaks *why*) so callers can catch it uniformly and surface a
 * `{ success: false, error }` result.
 */

export type DashboardGuardContext = {
  session: SessionData;
  member: AppMember | null;
};

export type OwnerGuardContext = {
  session: SessionData;
  member: AppMember;
};

async function requireSessionMember(): Promise<OwnerGuardContext> {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");

  const member = await getMemberForSession(session);
  if (!member) throw new Error("غير مصرح");

  return { session, member };
}

/** Any role allowed to view the dashboard (owner, admin, participant). */
export async function requireDashboardMember(): Promise<DashboardGuardContext> {
  const ctx = await requireSessionMember();
  if (!canAccessDashboard(ctx.member.role)) throw new Error("غير مصرح");
  return ctx;
}

/** Owner-only actions (create/update/delete/manage). */
export async function requireOwner(): Promise<OwnerGuardContext> {
  const ctx = await requireDashboardMember();
  if (!canManageMembers(ctx.member?.role)) throw new Error("غير مصرح");
  return { session: ctx.session, member: ctx.member as AppMember };
}

/**
 * Owner, or a member explicitly granted this dashboard page.
 * Does not require a dashboard role, so veterans/newcomers can be included.
 */
export async function requirePageAccess(
  path: DashboardPagePath,
): Promise<OwnerGuardContext> {
  const ctx = await requireSessionMember();
  if (canManageMembers(ctx.member.role)) return ctx;

  const permissions = await getMemberPagePermissions(ctx.member.id);
  if (!hasPagePermission(permissions, path)) throw new Error("غير مصرح");
  return ctx;
}
