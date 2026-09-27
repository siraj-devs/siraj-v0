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

const GRANTABLE_PATHS: readonly string[] = GRANTABLE_DASHBOARD_PAGES.map(
  (page) => page.path,
);

export function isDashboardPagePath(value: string): value is DashboardPagePath {
  return GRANTABLE_PATHS.includes(value);
}

export function normalizePagePermissions(values: unknown): DashboardPagePath[] {
  if (!Array.isArray(values)) return [];
  const out = new Set<DashboardPagePath>();
  for (const value of values) {
    if (typeof value === "string" && isDashboardPagePath(value)) {
      out.add(value);
    }
  }
  return GRANTABLE_DASHBOARD_PAGES.map((page) => page.path).filter((path) =>
    out.has(path),
  );
}

export function hasPagePermission(
  permissions: readonly string[],
  pathname: string,
): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return permissions.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`),
  );
}
