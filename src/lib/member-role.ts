export type MemberRole =
  | "owner"
  | "admin"
  | "participant"
  | "veteran"
  | "newcomer";

/** Highest privilege first — used for members list ordering. */
export const MEMBER_ROLE_ORDER: readonly MemberRole[] = [
  "owner",
  "admin",
  "participant",
  "veteran",
  "newcomer",
] as const;

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: "مالك",
  admin: "مشرف",
  participant: "عضو",
  veteran: "مخضرم",
  newcomer: "وافد",
};

export function memberRoleRank(role: MemberRole) {
  const index = MEMBER_ROLE_ORDER.indexOf(role);
  return index === -1 ? MEMBER_ROLE_ORDER.length : index;
}

/**
 * Owner sees every role as-is. Admin sees owner/admin as مشرف.
 * Everyone else sees owner/admin as عضو.
 */
export function roleVisibleTo(
  viewerRole: MemberRole | null | undefined,
  role: MemberRole,
): MemberRole {
  if (viewerRole === "owner") return role;
  if (role !== "owner" && role !== "admin") return role;
  return viewerRole === "admin" ? "admin" : "participant";
}

/** Roles this viewer can ever see (after `roleVisibleTo` masking). */
export function isRoleVisibleTo(
  viewerRole: MemberRole | null | undefined,
  role: MemberRole,
) {
  if (role === "owner") return viewerRole === "owner";
  if (role === "admin") return viewerRole === "owner" || viewerRole === "admin";
  return true;
}
