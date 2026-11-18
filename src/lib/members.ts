import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/member-role";
import {
  composeMemberName,
  isArabicNamePart,
  isValidPhone,
  splitMemberName,
} from "@/lib/profile-fields";

export type { MemberRole } from "@/lib/member-role";
export {
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_ORDER,
  memberRoleRank,
  roleVisibleTo,
} from "@/lib/member-role";

export type AppMember = {
  id: number;
  first_name: string;
  last_name: string;
  /** Full display name (`first_name` + `last_name`), kept for lookups/UI. */
  name: string;
  email: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  ft_connection: number | null;
  dc_connection: string | null;
  google_connection: string | null;
  role: MemberRole;
};

const MEMBER_COLUMNS =
  "id, first_name, last_name, name, email, phone, phone_verified_at, ft_connection, dc_connection, google_connection, role";

/** Normalize a DB row into AppMember (fills first/last from name when needed). */
export function mapAppMember(row: Record<string, unknown> | null): AppMember | null {
  if (!row) return null;
  const name = String(row.name ?? "").trim();
  let first_name = String(row.first_name ?? "").trim();
  let last_name = String(row.last_name ?? "").trim();
  if (!first_name && name) {
    const parts = splitMemberName(name);
    first_name = parts.first_name;
    last_name = parts.last_name;
  }
  return {
    id: Number(row.id),
    first_name,
    last_name,
    name: name || composeMemberName(first_name, last_name),
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    phone_verified_at: (row.phone_verified_at as string | null) ?? null,
    ft_connection: (row.ft_connection as number | null) ?? null,
    dc_connection: (row.dc_connection as string | null) ?? null,
    google_connection: (row.google_connection as string | null) ?? null,
    role: row.role as MemberRole,
  };
}

export function isMemberProfileComplete(
  member: Pick<AppMember, "first_name" | "last_name" | "phone"> | null | undefined,
): boolean {
  if (!member) return false;
  return (
    isArabicNamePart(member.first_name) &&
    isArabicNamePart(member.last_name) &&
    Boolean(member.phone && isValidPhone(member.phone))
  );
}

export { composeMemberName };

export function isPhoneVerified(
  member: Pick<AppMember, "phone_verified_at"> | null | undefined,
): boolean {
  return Boolean(member?.phone_verified_at);
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

  return mapAppMember((data as Record<string, unknown> | null) ?? null);
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

  return mapAppMember((data as Record<string, unknown> | null) ?? null);
}

export async function getMemberByGoogleConnectionId(
  googleConnectionId: string,
): Promise<AppMember | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_COLUMNS)
    .eq("google_connection", googleConnectionId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching member by google_connection:", error);
    return null;
  }

  return mapAppMember((data as Record<string, unknown> | null) ?? null);
}

export async function getMemberForSession(
  session: SessionData | null | undefined,
): Promise<AppMember | null> {
  if (!session?.user?.id) return null;

  if (session.provider === "discord") {
    return getMemberByDcConnectionId(session.user.id);
  }

  if (session.provider === "google") {
    return getMemberByGoogleConnectionId(session.user.id);
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
