import { canAccessDashboard, getMemberByFtConnectionId } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
    if (!request.cookies.has("42-session"))
      return NextResponse.redirect(new URL("/login", request.url));

    let session: SessionData;
    try {
      session = JSON.parse(request.cookies.get("42-session")!.value);
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const member = await getMemberByFtConnectionId(session.user.id);
    if (!canAccessDashboard(member?.role))
      return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
