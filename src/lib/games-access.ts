import type { MemberRole } from "@/lib/member-role";
import {
  hasPageEdit,
  hasPagePermission,
  type PageGrant,
} from "@/lib/page-permissions";

/**
 * Single source of truth for who may use game templates. Pure (no server
 * imports) so the navigation can call it too; server guards live in
 * `auth-guards.ts` / `dashboard-gate.ts` and call this.
 *
 * Built on the dashboard page-permission grants for `/dashboard/games`:
 * - `games.view`   = list templates and open them read-only (view or edit grant)
 * - `games.manage` = create / edit / delete / duplicate / start (edit grant)
 * Owners always have both.
 */
export const GAMES_PATH = "/dashboard/games" as const;

export type GamesPermission = "games.view" | "games.manage";

export function canManageGames(
  member: { role: MemberRole | null } | null | undefined,
  permissions: readonly PageGrant[],
  permission: GamesPermission = "games.manage",
): boolean {
  if (!member) return false;
  if (member.role === "owner") return true;
  return permission === "games.view"
    ? hasPagePermission(permissions, GAMES_PATH)
    : hasPageEdit(permissions, GAMES_PATH);
}
