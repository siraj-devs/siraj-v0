import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/member-role";

export type { MemberRole } from "@/lib/member-role";
export {
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_ORDER,
  memberRoleRank,
} from "@/lib/member-role";

export type AppMember = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  ft_connection: number | null;
  dc_connection: string | null;
  role: MemberRole;
};

const MEMBER_COLUMNS =
  "id, name, email, phone, ft_connection, dc_connection, role";

export function isMemberProfileComplete(
  member: Pick<AppMember, "name" | "email" | "phone"> | null | undefined,
): boolean {
  if (!member) return false;
  return (
    member.name.trim().length > 0 &&
    Boolean(member.email?.trim()) &&
    Boolean(member.phone && member.phone.trim().length >= 8)
  );
}

export async function getMemberByFtConnectionId(
  ftConnectionId: string | number,
): Promise<AppMember | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_COLUMNS)
    .eq("ft_connection", Number(ftConnectionId))
    .maybeSingle();

  if (error) {
    console.error("Error fetching member by ft_connection:", error);
    return null;
  }

  return (data as AppMember | null) ?? null;
}

export async function getMemberByDcConnectionId(
  dcConnectionId: string,
): Promise<AppMember | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_COLUMNS)
    .eq("dc_connection", dcConnectionId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching member by dc_connection:", error);
    return null;
  }

  return (data as AppMember | null) ?? null;
}

export async function getMemberForSession(
  session: SessionData | null | undefined,
): Promise<AppMember | null> {
  if (!session?.user?.id) return null;

  if (session.provider === "discord") {
    return getMemberByDcConnectionId(session.user.id);
  }

  return getMemberByFtConnectionId(session.user.id);
}

/** Owner / admin / participant may open the dashboard (view). */
export function canAccessDashboard(role: MemberRole | null | undefined) {
  return role === "owner" || role === "admin" || role === "participant";
}

export function canManageMembers(role: MemberRole | null | undefined) {
  return role === "owner";
}

/** Limited dashboard routes for admin & participant. Owners may open any path. */
export const VIEWER_DASHBOARD_PATHS = [
  "/dashboard/members",
  "/dashboard/calendar",
  "/dashboard/finance",
  "/dashboard/meetings",
] as const;

/** @deprecated Use VIEWER_DASHBOARD_PATHS */
export const ADMIN_DASHBOARD_PATHS = VIEWER_DASHBOARD_PATHS;

export function canAccessDashboardPath(
  role: MemberRole | null | undefined,
  pathname: string,
): boolean {
  if (!canAccessDashboard(role)) return false;
  if (role === "owner") return true;

  const path = pathname.replace(/\/+$/, "") || "/";
  return VIEWER_DASHBOARD_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`),
  );
}
