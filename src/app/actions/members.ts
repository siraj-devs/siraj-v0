"use server";

import { requirePageAccess, requirePageEdit } from "@/lib/auth-guards";
import {
  getMemberPagePermissions,
  getPagePermissionsByMember,
  setMemberPagePermissions,
} from "@/lib/member-permissions";
import {
  canManageMembers,
  composeMemberName,
  memberRoleRank,
  type AppMember,
  type MemberRole,
} from "@/lib/members";
import {
  isArabicNamePart,
  isValidPhone,
} from "@/lib/profile-fields";
import { hasPageEdit, type PageGrant } from "@/lib/page-permissions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MEMBERS_PATH = "/dashboard/members" as const;

export type MemberProfile = AppMember & {
  login: string | null;
  avatar: string | null;
  dc_username: string | null;
  dc_avatar: string | null;
  google_email: string | null;
  google_avatar: string | null;
  page_permissions: PageGrant[];
};

export type FtConnectionOption = {
  id: number;
  login: string;
  name: string | null;
  avatar: string | null;
};

export type DcConnectionOption = {
  id: string;
  username: string;
  email: string | null;
  avatar: string | null;
};

export type GoogleConnectionOption = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
};

const ROLE_VALUES: MemberRole[] = [
  "owner",
  "admin",
  "participant",
  "veteran",
  "newcomer",
];

function revalidateMembers() {
  revalidatePath("/dashboard/members");
  revalidatePath("/", "layout");
}

const MEMBER_PROFILE_SELECT =
  "id, first_name, last_name, name, email, phone, phone_verified_at, role, ft_connection, dc_connection, google_connection, ft_connections(login, avatar), dc_connections(username, avatar), google_connections(email, avatar)";

function mapMemberProfileRow(
  row: Record<string, unknown>,
  pagePermissions: PageGrant[] = [],
): MemberProfile {
  const ftRaw = row.ft_connections;
  const dcRaw = row.dc_connections;
  const googleRaw = row.google_connections;
  const ft = Array.isArray(ftRaw) ? ftRaw[0] : ftRaw;
  const dc = Array.isArray(dcRaw) ? dcRaw[0] : dcRaw;
  const google = Array.isArray(googleRaw) ? googleRaw[0] : googleRaw;
  const ftRow = ft as { login?: string | null; avatar?: string | null } | null;
  const dcRow = dc as {
    username?: string | null;
    avatar?: string | null;
  } | null;
  const googleRow = google as {
    email?: string | null;
    avatar?: string | null;
  } | null;

  const first_name = String(row.first_name ?? "").trim();
  const last_name = String(row.last_name ?? "").trim();
  const name =
    String(row.name ?? "").trim() ||
    [first_name, last_name].filter(Boolean).join(" ");

  return {
    id: row.id as number,
    first_name,
    last_name,
    name,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    phone_verified_at: (row.phone_verified_at as string | null) ?? null,
    role: row.role as MemberRole,
    ft_connection: (row.ft_connection as number | null) ?? null,
    dc_connection: (row.dc_connection as string | null) ?? null,
    google_connection: (row.google_connection as string | null) ?? null,
    login: ftRow?.login ?? null,
    avatar: ftRow?.avatar ?? dcRow?.avatar ?? googleRow?.avatar ?? null,
    dc_username: dcRow?.username ?? null,
    dc_avatar: dcRow?.avatar ?? null,
    google_email: googleRow?.email ?? null,
    google_avatar: googleRow?.avatar ?? null,
    page_permissions: pagePermissions,
  };
}

async function canViewMemberPermissionGrants(memberId: number, role: MemberRole) {
  if (canManageMembers(role)) return true;
  const grants = await getMemberPagePermissions(memberId);
  return hasPageEdit(grants, MEMBERS_PATH);
}

/** Phone numbers: owner, or anyone with edit access to the members page. */
async function canViewMemberPhones(memberId: number, role: MemberRole) {
  if (canManageMembers(role)) return true;
  const grants = await getMemberPagePermissions(memberId);
  return hasPageEdit(grants, MEMBERS_PATH);
}

function withoutPhone(member: MemberProfile): MemberProfile {
  return { ...member, phone: null, phone_verified_at: null };
}

function isPrivilegedRole(role: MemberRole | null | undefined) {
  return role === "owner" || role === "admin";
}

export async function getClubMembers(): Promise<MemberProfile[]> {
  let member;
  try {
    ({ member } = await requirePageAccess(MEMBERS_PATH));
  } catch {
    ({ member } = await requirePageAccess("/dashboard/courses"));
  }
  const [includePermissions, includePhones] = await Promise.all([
    canViewMemberPermissionGrants(member.id, member.role),
    canViewMemberPhones(member.id, member.role),
  ]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_PROFILE_SELECT)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching members:", error);
    throw new Error("تعذر جلب الأعضاء");
  }

  const permissionsByMember = includePermissions
    ? await getPagePermissionsByMember()
    : new Map<number, PageGrant[]>();

  return (data ?? [])
    .map((row) => {
      const profile = mapMemberProfileRow(
        row as Record<string, unknown>,
        permissionsByMember.get(row.id as number) ?? [],
      );
      return includePhones ? profile : withoutPhone(profile);
    })
    .sort((a, b) => {
      const byRole = memberRoleRank(a.role) - memberRoleRank(b.role);
      if (byRole !== 0) return byRole;
      return a.name.localeCompare(b.name, "ar");
    });
}

export async function getClubMemberById(
  id: number,
): Promise<MemberProfile | null> {
  if (!Number.isFinite(id)) return null;

  const { member } = await requirePageAccess(MEMBERS_PATH);
  const [includePermissions, includePhones] = await Promise.all([
    canViewMemberPermissionGrants(member.id, member.role),
    canViewMemberPhones(member.id, member.role),
  ]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching member:", error);
    return null;
  }
  if (!data) return null;

  const permissions = includePermissions
    ? (await getPagePermissionsByMember()).get(id) ?? []
    : [];

  const profile = mapMemberProfileRow(
    data as Record<string, unknown>,
    permissions,
  );
  return includePhones ? profile : withoutPhone(profile);
}

export async function getAvailableFtConnections(
  currentConnectionId?: number | null,
): Promise<FtConnectionOption[]> {
  await requirePageEdit(MEMBERS_PATH);
  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("ft_connection")
    .not("ft_connection", "is", null);

  if (membersError) {
    console.error("Error fetching linked ft connections:", membersError);
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

export async function getAvailableDcConnections(
  currentConnectionId?: string | null,
): Promise<DcConnectionOption[]> {
  await requirePageEdit(MEMBERS_PATH);
  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("dc_connection")
    .not("dc_connection", "is", null);

  if (membersError) {
    console.error("Error fetching linked dc connections:", membersError);
    throw new Error("تعذر جلب اتصالات ديسكورد");
  }

  const linkedIds = new Set(
    (members ?? [])
      .map((m) => m.dc_connection as string | null)
      .filter(
        (id): id is string => id != null && id !== currentConnectionId,
      ),
  );

  const { data: connections, error } = await supabase
    .from("dc_connections")
    .select("id, username, email, avatar")
    .order("username", { ascending: true });

  if (error) {
    console.error("Error fetching dc_connections:", error);
    throw new Error("تعذر جلب اتصالات ديسكورد");
  }

  return (connections ?? [])
    .filter((c) => !linkedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      username: c.username,
      email: c.email,
      avatar: c.avatar,
    }));
}

export async function getAvailableGoogleConnections(
  currentConnectionId?: string | null,
): Promise<GoogleConnectionOption[]> {
  await requirePageEdit(MEMBERS_PATH);
  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("google_connection")
    .not("google_connection", "is", null);

  if (membersError) {
    console.error("Error fetching linked google connections:", membersError);
    throw new Error("تعذر جلب اتصالات Google");
  }

  const linkedIds = new Set(
    (members ?? [])
      .map((m) => m.google_connection as string | null)
      .filter(
        (id): id is string => id != null && id !== currentConnectionId,
      ),
  );

  const { data: connections, error } = await supabase
    .from("google_connections")
    .select("id, email, name, avatar")
    .order("email", { ascending: true });

  if (error) {
    console.error("Error fetching google_connections:", error);
    throw new Error("تعذر جلب اتصالات Google");
  }

  return (connections ?? [])
    .filter((c) => !linkedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      avatar: c.avatar,
    }));
}

export async function createMember(input: {
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: MemberRole;
  ft_connection?: number | null;
  dc_connection?: string | null;
  google_connection?: string | null;
  page_permissions?: PageGrant[];
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { member: current } = await requirePageEdit(MEMBERS_PATH);

    const first_name = input.first_name?.trim() ?? "";
    const last_name = input.last_name?.trim() ?? "";
    const phone = input.phone?.trim() || null;
    const name = composeMemberName(first_name, last_name);
    const role = input.role;
    const ft_connection = input.ft_connection ?? null;
    const dc_connection = input.dc_connection?.trim() || null;
    const google_connection = input.google_connection?.trim() || null;

    if (!isArabicNamePart(first_name))
      return { success: false, error: "الاسم الأول يجب أن يكون بالعربية" };
    if (!isArabicNamePart(last_name))
      return { success: false, error: "اسم العائلة يجب أن يكون بالعربية" };
    if (phone && !isValidPhone(phone))
      return { success: false, error: "رقم الهاتف غير صالح" };
    if (!ROLE_VALUES.includes(role))
      return { success: false, error: "الدور غير صالح" };
    if (isPrivilegedRole(role) && !canManageMembers(current.role))
      return { success: false, error: "تعيين هذا الدور للمالك فقط" };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .insert({
        first_name,
        last_name,
        name,
        phone,
        role,
        ft_connection,
        dc_connection,
        google_connection,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error creating member:", error);
      if (error?.code === "23505")
        return { success: false, error: "هذا الحساب مرتبط بعضو آخر" };
      return { success: false, error: "تعذر إنشاء العضو" };
    }

    if (canManageMembers(current.role)) {
      const saved = await setMemberPagePermissions(
        data.id,
        input.page_permissions ?? [],
      );
      if (!saved.success) return saved;
    }

    revalidateMembers();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function updateMember(input: {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: MemberRole;
  ft_connection?: number | null;
  dc_connection?: string | null;
  google_connection?: string | null;
  page_permissions?: PageGrant[];
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { member: current } = await requirePageEdit(MEMBERS_PATH);

    const id = Number(input.id);
    const first_name = input.first_name?.trim() ?? "";
    const last_name = input.last_name?.trim() ?? "";
    const phone = input.phone?.trim() || null;
    const name = composeMemberName(first_name, last_name);
    const role = input.role;
    const ft_connection = input.ft_connection ?? null;
    const dc_connection = input.dc_connection?.trim() || null;
    const google_connection = input.google_connection?.trim() || null;

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };
    if (!isArabicNamePart(first_name))
      return { success: false, error: "الاسم الأول يجب أن يكون بالعربية" };
    if (!isArabicNamePart(last_name))
      return { success: false, error: "اسم العائلة يجب أن يكون بالعربية" };
    if (phone && !isValidPhone(phone))
      return { success: false, error: "رقم الهاتف غير صالح" };
    if (!ROLE_VALUES.includes(role))
      return { success: false, error: "الدور غير صالح" };

    if (current.id === id && current.role === "owner" && role !== "owner") {
      return {
        success: false,
        error: "لا يمكنك إزالة دور المالك عن نفسك",
      };
    }

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("members")
      .select("phone, role")
      .eq("id", id)
      .maybeSingle();
    if (!existing) return { success: false, error: "العضو غير موجود" };

    const existingRole = existing.role as MemberRole;
    const isOwner = canManageMembers(current.role);
    // Only the owner grants or removes owner/admin. Other editors keep a
    // privileged member's role as-is (they may see it masked in the UI).
    let nextRole = role;
    if (!isOwner) {
      if (isPrivilegedRole(existingRole)) nextRole = existingRole;
      else if (isPrivilegedRole(role))
        return { success: false, error: "تعيين هذا الدور للمالك فقط" };
    }

    const canSeePhones = await canViewMemberPhones(current.id, current.role);
    const existingPhone = (existing.phone as string | null) ?? null;
    // Editors who can't see phones submit an empty field; keep the stored number.
    const nextPhone = canSeePhones ? phone : existingPhone;
    const phoneChanged = nextPhone !== existingPhone;

    const { error } = await supabase
      .from("members")
      .update({
        first_name,
        last_name,
        name,
        phone: nextPhone,
        ...(phoneChanged ? { phone_verified_at: null } : {}),
        role: nextRole,
        ft_connection,
        dc_connection,
        google_connection,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating member:", error);
      if (error.code === "23505")
        return { success: false, error: "هذا الحساب مرتبط بعضو آخر" };
      return { success: false, error: "تعذر تحديث العضو" };
    }

    if (canManageMembers(current.role)) {
      const saved = await setMemberPagePermissions(
        id,
        input.page_permissions ?? [],
      );
      if (!saved.success) return saved;
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
    const { member: current } = await requirePageEdit(MEMBERS_PATH);

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
