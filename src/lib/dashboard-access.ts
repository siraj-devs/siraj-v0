import {
  canAccessDashboard,
  canManageMembers,
  VIEWER_DASHBOARD_PATHS,
  type MemberRole,
} from "@/lib/members";
import {
  GRANTABLE_DASHBOARD_PAGES,
  hasPagePermission,
  type PageGrant,
} from "@/lib/page-permissions";

export function canOpenDashboard(
  role: MemberRole | null | undefined,
  permissions: readonly PageGrant[],
) {
  return canAccessDashboard(role) || permissions.length > 0;
}

export function canOpenDashboardPath(
  role: MemberRole | null | undefined,
  permissions: readonly PageGrant[],
  pathname: string,
): boolean {
  if (role === "owner") return true;

  const path = pathname.replace(/\/+$/, "") || "/";
  if (
    canAccessDashboard(role) &&
    VIEWER_DASHBOARD_PATHS.some(
      (allowed) => path === allowed || path.startsWith(`${allowed}/`),
    )
  ) {
    return true;
  }

  return hasPagePermission(permissions, path);
}

/** Where `/dashboard` and denied routes should send this member. */
export function dashboardEntryPath(
  role: MemberRole | null | undefined,
  permissions: readonly PageGrant[],
): string {
  if (canManageMembers(role)) return "/dashboard/submissions";
  if (canAccessDashboard(role)) return "/dashboard/members";
  const granted = GRANTABLE_DASHBOARD_PAGES.find((page) =>
    permissions.some((grant) => grant.path === page.path),
  );
  return granted?.path ?? "/";
}
