import { createClient } from "@/lib/supabase/server";

export type MemberRole = "owner" | "admin" | "visitor";

export type AppMember = {
  id: number;
  name: string;
  ft_connection: number | null;
  role: MemberRole;
};

const MEMBER_COLUMNS = "id, name, ft_connection, role";

export async function ensureMemberFromFtConnection(params: {
  ftConnectionId: number;
  name: string;
}): Promise<AppMember | null> {
  const supabase = await createClient();
  const { ftConnectionId, name } = params;

  const { data: existing, error: selectError } = await supabase
    .from("members")
    .select(MEMBER_COLUMNS)
    .eq("ft_connection", ftConnectionId)
    .maybeSingle();

  if (selectError) {
    console.error("Error fetching member:", selectError);
    return null;
  }

  if (existing) {
    if (existing.name !== name) {
      const { data: updated, error: updateError } = await supabase
        .from("members")
        .update({ name })
        .eq("id", existing.id)
        .select(MEMBER_COLUMNS)
        .single();

      if (updateError) {
        console.error("Error updating member name:", updateError);
        return existing as AppMember;
      }

      return updated as AppMember;
    }

    return existing as AppMember;
  }

  const { data: created, error: insertError } = await supabase
    .from("members")
    .insert({
      name,
      ft_connection: ftConnectionId,
      role: "visitor",
    })
    .select(MEMBER_COLUMNS)
    .single();

  if (insertError) {
    console.error("Error creating member:", insertError);
    return null;
  }

  return created as AppMember;
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

export function canAccessDashboard(role: MemberRole | null | undefined) {
  return role === "owner" || role === "admin";
}
