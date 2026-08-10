import {
  canAccessDashboard,
  canManageMembers,
  getMemberForSession,
  type AppMember,
} from "@/lib/members";
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

/** Any role allowed to view the dashboard (owner, admin, participant). */
export async function requireDashboardMember(): Promise<DashboardGuardContext> {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");

  const member = await getMemberForSession(session);
  if (!canAccessDashboard(member?.role)) throw new Error("غير مصرح");

  return { session, member };
}

/** Owner-only actions (create/update/delete/manage). */
export async function requireOwner(): Promise<OwnerGuardContext> {
  const ctx = await requireDashboardMember();
  if (!canManageMembers(ctx.member?.role)) throw new Error("غير مصرح");
  return { session: ctx.session, member: ctx.member as AppMember };
}
