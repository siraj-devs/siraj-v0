import { createClient } from "@/lib/supabase/server";

export type UserRole = "owner" | "admin" | "member" | "visitor";

export type AppUser = {
  id: number;
  name: string;
  ft_connection: number | null;
  role: UserRole;
};

const USER_COLUMNS = "id, name, ft_connection, role";

export async function ensureUserFromFtConnection(params: {
  ftConnectionId: number;
  name: string;
}): Promise<AppUser | null> {
  const supabase = await createClient();
  const { ftConnectionId, name } = params;

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("ft_connection", ftConnectionId)
    .maybeSingle();

  if (selectError) {
    console.error("Error fetching user:", selectError);
    return null;
  }

  if (existing) {
    if (existing.name !== name) {
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update({ name })
        .eq("id", existing.id)
        .select(USER_COLUMNS)
        .single();

      if (updateError) {
        console.error("Error updating user name:", updateError);
        return existing as AppUser;
      }

      return updated as AppUser;
    }

    return existing as AppUser;
  }

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      name,
      ft_connection: ftConnectionId,
      role: "visitor",
    })
    .select(USER_COLUMNS)
    .single();

  if (insertError) {
    console.error("Error creating user:", insertError);
    return null;
  }

  return created as AppUser;
}

export async function getUserByFtConnectionId(
  ftConnectionId: string | number,
): Promise<AppUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select(USER_COLUMNS)
    .eq("ft_connection", Number(ftConnectionId))
    .maybeSingle();

  if (error) {
    console.error("Error fetching user by ft_connection:", error);
    return null;
  }

  return (data as AppUser | null) ?? null;
}

export function canAccessDashboard(role: UserRole | null | undefined) {
  return role === "owner";
}
