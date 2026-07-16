"use server";

import {
  canAccessDashboard,
  canManageMembers,
  getMemberByFtConnectionId,
  type AppMember,
  type MemberRole,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MemberProfile = AppMember & {
  login: string | null;
  avatar: string | null;
};

export type FtConnectionOption = {
  id: number;
  login: string;
  name: string | null;
  avatar: string | null;
};

const ROLE_VALUES: MemberRole[] = ["owner", "admin", "visitor"];

async function requireDashboardAccess() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");

  const member = await getMemberByFtConnectionId(session.user.id);
  if (!canAccessDashboard(member?.role)) throw new Error("غير مصرح");

  return { session, member };
}

async function requireOwner() {
  const ctx = await requireDashboardAccess();
  if (!canManageMembers(ctx.member?.role)) throw new Error("غير مصرح");
  return ctx;
}

function revalidateMembers() {
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/back-end/members");
}

export async function getClubMembers(): Promise<MemberProfile[]> {
  await requireDashboardAccess();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select(
      "id, name, role, ft_connection, ft_connections(login, avatar)",
    )
    .order("role", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching members:", error);
    throw new Error("تعذر جلب الأعضاء");
  }

  return (data ?? []).map((row) => {
    const connection = Array.isArray(row.ft_connections)
      ? row.ft_connections[0]
      : row.ft_connections;

    return {
      id: row.id,
      name: row.name,
      role: row.role as MemberRole,
      ft_connection: row.ft_connection,
      login: connection?.login ?? null,
      avatar: connection?.avatar ?? null,
    };
  });
}

export async function getAvailableFtConnections(
  currentConnectionId?: number | null,
): Promise<FtConnectionOption[]> {
  await requireOwner();
  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("ft_connection")
    .not("ft_connection", "is", null);

  if (membersError) {
    console.error("Error fetching linked connections:", membersError);
    throw new Error("تعذر جلب الاتصالات");
  }

  const linkedIds = new Set(
    (members ?? [])
      .map((m) => m.ft_connection as number | null)
      .filter((id): id is number => id != null && id !== currentConnectionId),
  );

  const { data: connections, error } = await supabase
    .from("ft_connections")
    .select("id, login, name, avatar")
    .order("login", { ascending: true });

  if (error) {
    console.error("Error fetching ft_connections:", error);
    throw new Error("تعذر جلب الاتصالات");
  }

  return (connections ?? [])
    .filter((c) => !linkedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      login: c.login,
      name: c.name,
      avatar: c.avatar,
    }));
}

export async function createMember(input: {
  name: string;
  role: MemberRole;
  ft_connection?: number | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();

    const name = input.name?.trim();
    const role = input.role;
    const ft_connection = input.ft_connection ?? null;

    if (!name) return { success: false, error: "الاسم مطلوب" };
    if (!ROLE_VALUES.includes(role))
      return { success: false, error: "الدور غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase.from("members").insert({
      name,
      role,
      ft_connection,
    });

    if (error) {
      console.error("Error creating member:", error);
      if (error.code === "23505")
        return { success: false, error: "هذا الحساب مرتبط بعضو آخر" };
      return { success: false, error: "تعذر إنشاء العضو" };
    }

    revalidateMembers();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function updateMember(input: {
  id: number;
  name: string;
  role: MemberRole;
  ft_connection?: number | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { member: current } = await requireOwner();

    const id = Number(input.id);
    const name = input.name?.trim();
    const role = input.role;
    const ft_connection = input.ft_connection ?? null;

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };
    if (!name) return { success: false, error: "الاسم مطلوب" };
    if (!ROLE_VALUES.includes(role))
      return { success: false, error: "الدور غير صالح" };

    if (current?.id === id && role !== "owner") {
      return {
        success: false,
        error: "لا يمكنك إزالة دور المالك عن نفسك",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("members")
      .update({ name, role, ft_connection })
      .eq("id", id);

    if (error) {
      console.error("Error updating member:", error);
      if (error.code === "23505")
        return { success: false, error: "هذا الحساب مرتبط بعضو آخر" };
      return { success: false, error: "تعذر تحديث العضو" };
    }

    revalidateMembers();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteMember(
  id: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { member: current } = await requireOwner();

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };

    if (current?.id === id) {
      return { success: false, error: "لا يمكنك حذف حسابك" };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      console.error("Error deleting member:", error);
      return { success: false, error: "تعذر حذف العضو" };
    }

    revalidateMembers();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
