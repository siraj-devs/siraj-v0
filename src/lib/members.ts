import { createClient } from "@/lib/supabase/server";

export type MemberRole = "owner" | "admin" | "veteran" | "visitor";

export type AppMember = {
  id: number;
  name: string;
  ft_connection: number | null;
  dc_connection: string | null;
  role: MemberRole;
};

const MEMBER_COLUMNS = "id, name, ft_connection, dc_connection, role";

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

export function canAccessDashboard(role: MemberRole | null | undefined) {
  return role === "owner" || role === "admin" || role === "veteran";
}

export function canManageMembers(role: MemberRole | null | undefined) {
  return role === "owner";
}

/** Dashboard routes admin/veteran may open. Owners may open any /dashboard path. */
export const ADMIN_DASHBOARD_PATHS = [
  "/dashboard/members",
  "/dashboard/calendar",
  "/dashboard/finance",
  "/dashboard/meetings",
] as const;

export function canAccessDashboardPath(
  role: MemberRole | null | undefined,
  pathname: string,
): boolean {
  if (!canAccessDashboard(role)) return false;
  if (role === "owner") return true;

  const path = pathname.replace(/\/+$/, "") || "/";
  return ADMIN_DASHBOARD_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`),
  );
}
