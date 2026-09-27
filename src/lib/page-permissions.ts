/** Owner-only dashboard pages that can be granted to any member. */
export const GRANTABLE_DASHBOARD_PAGES = [
  { path: "/dashboard/submissions", label: "التقديمات" },
  { path: "/dashboard/connections", label: "الاتصالات" },
  { path: "/dashboard/content", label: "المحتوى" },
  { path: "/dashboard/courses", label: "الدورات" },
  { path: "/dashboard/profile-requests", label: "طلبات الملف" },
  { path: "/dashboard/sessions", label: "الأمسيات" },
  { path: "/dashboard/network", label: "الشبكة" },
  { path: "/dashboard/events", label: "الأحداث" },
] as const;

export type DashboardPagePath =
  (typeof GRANTABLE_DASHBOARD_PAGES)[number]["path"];

export type PageAccessLevel = "view" | "edit";

export type PageGrant = {
  path: DashboardPagePath;
  access: PageAccessLevel;
};

const GRANTABLE_PATHS: readonly string[] = GRANTABLE_DASHBOARD_PAGES.map(
  (page) => page.path,
);

export function isDashboardPagePath(value: string): value is DashboardPagePath {
  return GRANTABLE_PATHS.includes(value);
}

export function isPageAccessLevel(value: unknown): value is PageAccessLevel {
  return value === "view" || value === "edit";
}

export function normalizePageGrants(values: unknown): PageGrant[] {
  if (!Array.isArray(values)) return [];
  const byPath = new Map<DashboardPagePath, PageAccessLevel>();
  for (const value of values) {
    if (!value || typeof value !== "object") continue;
    const record = value as { path?: unknown; access?: unknown };
    if (typeof record.path !== "string" || !isDashboardPagePath(record.path)) {
      continue;
    }
    if (!isPageAccessLevel(record.access)) continue;
    const previous = byPath.get(record.path);
    if (previous === "edit") continue;
    byPath.set(record.path, record.access);
  }
  return GRANTABLE_DASHBOARD_PAGES.flatMap((page) => {
    const access = byPath.get(page.path);
    return access ? [{ path: page.path, access }] : [];
  });
}

function matchesGrantPath(pathname: string, allowed: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === allowed || path.startsWith(`${allowed}/`);
}

export function hasPagePermission(
  permissions: readonly PageGrant[],
  pathname: string,
): boolean {
  return permissions.some((grant) => matchesGrantPath(pathname, grant.path));
}

export function hasPageEdit(
  permissions: readonly PageGrant[],
  pathname: string,
): boolean {
  return permissions.some(
    (grant) =>
      grant.access === "edit" && matchesGrantPath(pathname, grant.path),
  );
}
