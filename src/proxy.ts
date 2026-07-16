import {
  canAccessDashboard,
  canAccessDashboardPath,
  getMemberForSession,
} from "@/lib/members";
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
  if (process.env.NODE_ENV === "production") {
    const supabase = await createClient();
    const { data } = await supabase.from("base").select("maintenance").single();

    if (data && data.maintenance && request.nextUrl.pathname !== "/maintenance")
      return NextResponse.redirect(new URL("/maintenance", request.url));

    if (
      data &&
      !data.maintenance &&
      request.nextUrl.pathname === "/maintenance"
    )
      return NextResponse.redirect(new URL("/", request.url));
  } else if (request.nextUrl.pathname === "/maintenance") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const session = readSessionCookie(request);
    if (!session)
      return NextResponse.redirect(new URL("/login", request.url));

    const member = await getMemberForSession(session);
    if (!canAccessDashboard(member?.role))
      return NextResponse.redirect(new URL("/", request.url));

    if (!canAccessDashboardPath(member?.role, request.nextUrl.pathname))
      return NextResponse.redirect(new URL("/dashboard/members", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
