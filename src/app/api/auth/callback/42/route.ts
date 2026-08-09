import env from "@/env";
import { linkConnectionToSessionMember } from "@/lib/link-connection";
import { exchangeCodeForToken, getUserInfo } from "@/lib/oauth";
import {
  parseOAuthState,
  profileLinkErrorUrl,
  profileLinkedUrl,
} from "@/lib/oauth-state";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

enum FtError {
  CONNECTION_FAILED = "connection_failed",
  UPDATE_FAILED = "update_failed",
}

type FtData = {
  id: number;
  displayname: string;
  login: string;
  image?: { link: string };
};

async function ft_connection(data: FtData): Promise<FtError | null> {
  const supabase = await createClient();

  const { error: supabaseError } = await supabase
    .from("ft_connections")
    .upsert(
      {
        id: data.id,
        name: data.displayname,
        login: data.login,
        avatar: data.image?.link ?? null,
      },
      { onConflict: "id" },
    )
    .select();

  if (supabaseError) return FtError.CONNECTION_FAILED;

  const { error: accessUpdateError } = await supabase
    .from("ft_connections")
    .update({
      access_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (accessUpdateError) return FtError.UPDATE_FAILED;

  const { error: authorizedUpdateError } = await supabase
    .from("ft_connections")
    .update({
      authorized_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .is("authorized_at", null);

  if (authorizedUpdateError) return FtError.UPDATE_FAILED;

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

    const { access_token, expires_in } = await exchangeCodeForToken(code);

    const userInfo = await getUserInfo(access_token);
    if (!userInfo)
      return NextResponse.redirect(
        link
          ? profileLinkErrorUrl(request.url, "user_info_error", redirect)
          : new URL("/login?error=user_info_error", request.url),
      );

    const ftError = await ft_connection(userInfo);
    if (ftError)
      return NextResponse.redirect(
        link
          ? profileLinkErrorUrl(request.url, ftError, redirect)
          : new URL(`/login?error=${ftError}`, request.url),
      );

    if (link) {
      const session = await getSession();
      const result = await linkConnectionToSessionMember(session, {
        provider: "42",
        id: userInfo.id,
      });
      if (!result.success) {
        return NextResponse.redirect(
          profileLinkErrorUrl(request.url, result.code, redirect),
        );
      }
      return NextResponse.redirect(
        profileLinkedUrl(request.url, "42", redirect),
      );
    }

    const sessionData = {
      user: {
        id: userInfo.id.toString(),
        login: userInfo.login,
        name: userInfo.displayname,
        image: userInfo.image?.link ?? null,
      },
      accessToken: access_token,
      provider: "42" as const,
    };

    const response = NextResponse.redirect(new URL(redirect, request.url));
    response.cookies.set("42-session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in,
    });
    response.cookies.delete("dc-session");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url),
    );
  }
}
