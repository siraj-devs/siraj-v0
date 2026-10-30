import env from "@/env";
import {
  exchangeGoogleCodeForToken,
  getGoogleUserInfo,
  type GoogleUser,
} from "@/lib/google-oauth";
import { linkConnectionToSessionMember } from "@/lib/link-connection";
import {
  parseOAuthState,
  profileLinkErrorUrl,
  profileLinkedUrl,
} from "@/lib/oauth-state";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

enum GoogleError {
  CONNECTION_FAILED = "connection_failed",
  UPDATE_FAILED = "update_failed",
}

async function google_connection(data: GoogleUser): Promise<GoogleError | null> {
  const supabase = await createClient();

  const { error: supabaseError } = await supabase
    .from("google_connections")
    .upsert(
      {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
      },
      { onConflict: "id" },
    )
    .select();

  if (supabaseError) return GoogleError.CONNECTION_FAILED;

  const { error: accessUpdateError } = await supabase
    .from("google_connections")
    .update({
      access_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (accessUpdateError) return GoogleError.UPDATE_FAILED;

  const { error: authorizedUpdateError } = await supabase
    .from("google_connections")
    .update({
      authorized_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .is("authorized_at", null);

  if (authorizedUpdateError) return GoogleError.UPDATE_FAILED;

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const { link, redirect } = parseOAuthState(state);

    if (error)
      return NextResponse.redirect(
        link
          ? profileLinkErrorUrl(request.url, "oauth_error", redirect)
          : new URL("/login?error=oauth_error", request.url),
      );
    if (!code)
      return NextResponse.redirect(
        link
          ? profileLinkErrorUrl(request.url, "no_code", redirect)
          : new URL("/login?error=no_code", request.url),
      );

    const { access_token, expires_in } =
      await exchangeGoogleCodeForToken(code);

    const userInfo = await getGoogleUserInfo(access_token);
    if (!userInfo)
      return NextResponse.redirect(
        link
          ? profileLinkErrorUrl(request.url, "user_info_error", redirect)
          : new URL("/login?error=user_info_error", request.url),
      );

    const googleError = await google_connection(userInfo);
    if (googleError)
      return NextResponse.redirect(
        link
          ? profileLinkErrorUrl(request.url, googleError, redirect)
          : new URL(`/login?error=${googleError}`, request.url),
      );

    if (link) {
      const session = await getSession();
      const result = await linkConnectionToSessionMember(session, {
        provider: "google",
        id: userInfo.id,
      });
      if (!result.success) {
        return NextResponse.redirect(
          profileLinkErrorUrl(request.url, result.code, redirect),
        );
      }
      return NextResponse.redirect(
        profileLinkedUrl(request.url, "google", redirect),
      );
    }

    const sessionData = {
      user: {
        id: userInfo.id,
        login: userInfo.login,
        name: userInfo.name,
        email: userInfo.email ?? undefined,
        image: userInfo.avatar,
      },
      accessToken: access_token,
      provider: "google" as const,
    };

    const response = NextResponse.redirect(new URL(redirect, request.url));
    response.cookies.set("google-session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in,
    });
    response.cookies.delete("42-session");
    response.cookies.delete("dc-session");
    return response;
  } catch (error) {
    console.error("[google] callback", error);
    const message = error instanceof Error ? error.message : "callback_error";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
