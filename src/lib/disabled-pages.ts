import { createClient } from "@/lib/supabase/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

export type DisabledPage = {
  path: string;
};

export type PublicPageStatus = {
  path: string;
  disabled: boolean;
};

export function normalizePublicPath(pathname: string) {
  if (!pathname) return "/";
  const path = pathname.split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function isProtectedFromDisable(path: string) {
  const normalized = normalizePublicPath(path);
  return (
    normalized === "/" ||
    normalized === "/login" ||
    normalized === "/profile" ||
    normalized.startsWith("/dashboard") ||
    normalized.startsWith("/api") ||
    normalized.startsWith("/_next") ||
    normalized === "/force-not-found" ||
    normalized === "/maintenance"
  );
}

export async function getDisabledPages(): Promise<DisabledPage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disabled_pages")
    .select("path")
    .order("path", { ascending: true });

  if (error) {
    console.error("Error fetching disabled pages:", error);
    return [];
  }

  return (data ?? []) as DisabledPage[];
}
async function collectPageFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectPageFiles(entryPath);
      return entry.name === "page.tsx" ? [entryPath] : [];
    }),
  );

  return files.flat();
}

function routeFromPageFile(filePath: string) {
  const appDir = path.join(process.cwd(), "src", "app");
  const relative = path.relative(appDir, filePath);
  const segments = relative
    .split(path.sep)
    .slice(0, -1)
    .filter((segment) => !segment.startsWith("(") || !segment.endsWith(")"));

  if (segments.length === 0) return "/";
  return `/${segments.join("/")}`;
}

export async function getPublicPageStatuses(): Promise<PublicPageStatus[]> {
  const [disabledPages, pageFiles] = await Promise.all([
    getDisabledPages(),
    collectPageFiles(path.join(process.cwd(), "src", "app")),
  ]);

  const disabledMap = new Map(
    disabledPages.map((page) => [normalizePublicPath(page.path), page]),
  );

  const routes = pageFiles
    .map(routeFromPageFile)
    .map(normalizePublicPath)
    .filter((routePath) => !isProtectedFromDisable(routePath))
    .filter((routePath) => !routePath.includes("[") && !routePath.includes("]"));

  const uniqueRoutes = Array.from(new Set(routes)).sort((a, b) =>
    a.localeCompare(b),
  );

  return uniqueRoutes.map((routePath) => {
    const disabledPage = disabledMap.get(routePath);
    return {
      path: routePath,
      disabled: Boolean(disabledPage),
    };
  });
}

export async function isPublicPathDisabled(pathname: string): Promise<boolean> {
  const path = normalizePublicPath(pathname);
  if (isProtectedFromDisable(path)) return false;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disabled_pages")
    .select("path")
    .eq("path", path)
    .maybeSingle();

  if (error) {
    console.error("Error checking disabled page:", error);
    return false;
  }

  return Boolean(data);
}
