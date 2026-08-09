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
