import env from "@/env";
import {
  canAccessDashboard,
  canAccessDashboardPath,
  getMemberForSession,
} from "@/lib/members";
import {
  isProtectedFromDisable,
  normalizePublicPath,
} from "@/lib/disabled-pages";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function readSessionCookie(request: NextRequest): SessionData | null {
  const ft = request.cookies.get("42-session");
  if (ft) {
    try {
      return { ...JSON.parse(ft.value), provider: "42" as const };
    } catch {
      return null;
    }
  }

  const dc = request.cookies.get("dc-session");
  if (dc) {
    try {
      return { ...JSON.parse(dc.value), provider: "discord" as const };
    } catch {
      return null;
    }
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const pathname = normalizePublicPath(request.nextUrl.pathname);

  if (env.NODE_ENV === "production") {
    const supabase = await createClient();
    const { data } = await supabase.from("base").select("maintenance").single();

    if (data && data.maintenance && pathname !== "/maintenance")
      return NextResponse.redirect(new URL("/maintenance", request.url));

    if (data && !data.maintenance && pathname === "/maintenance")
      return NextResponse.redirect(new URL("/", request.url));
  } else if (pathname === "/maintenance") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    !isProtectedFromDisable(pathname) &&
    pathname !== "/force-not-found"
  ) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("disabled_pages")
      .select("path")
      .eq("path", pathname)
      .maybeSingle();

    if (data) {
      return NextResponse.rewrite(new URL("/force-not-found", request.url));
    }
  }

  if (pathname.startsWith("/dashboard")) {
    const session = readSessionCookie(request);
    if (!session)
      return NextResponse.redirect(new URL("/login", request.url));

    const member = await getMemberForSession(session);
    if (!canAccessDashboard(member?.role))
      return NextResponse.redirect(new URL("/", request.url));

    if (!canAccessDashboardPath(member?.role, pathname))
      return NextResponse.redirect(new URL("/dashboard/members", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
