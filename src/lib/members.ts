import { createClient } from "@/lib/supabase/server";

export type MemberRole = "owner" | "admin" | "visitor";

export type AppMember = {
  id: number;
  name: string;
  ft_connection: number | null;
  role: MemberRole;
};

const MEMBER_COLUMNS = "id, name, ft_connection, role";

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

export function canAccessDashboard(role: MemberRole | null | undefined) {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role: MemberRole | null | undefined) {
  return role === "owner";
}
