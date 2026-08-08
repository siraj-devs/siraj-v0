import env from "@/env";
import {
  exchangeDiscordCodeForToken,
  getDiscordAvatarUrl,
  getDiscordUserInfo,
  type DiscordUser,
} from "@/lib/discord-oauth";
import { linkConnectionToSessionMember } from "@/lib/link-connection";
import {
  parseOAuthState,
  profileLinkErrorUrl,
  profileLinkedUrl,
} from "@/lib/oauth-state";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

enum DcError {
  CONNECTION_FAILED = "connection_failed",
  UPDATE_FAILED = "update_failed",
}

async function dc_connection(data: DiscordUser): Promise<DcError | null> {
  const supabase = await createClient();
  const avatar = getDiscordAvatarUrl(data.id, data.avatar);

  const { error: supabaseError } = await supabase
    .from("dc_connections")
    .upsert(
      {
        id: data.id,
        username: data.username,
        avatar,
        email: data.email ?? null,
      },
      { onConflict: "id" },
    )
    .select();

  if (supabaseError) return DcError.CONNECTION_FAILED;

  const { error: accessUpdateError } = await supabase
    .from("dc_connections")
    .update({
      access_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (accessUpdateError) return DcError.UPDATE_FAILED;

  const { error: authorizedUpdateError } = await supabase
    .from("dc_connections")
    .update({
      authorized_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .is("authorized_at", null);

  if (authorizedUpdateError) return DcError.UPDATE_FAILED;

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
      await exchangeDiscordCodeForToken(code);

    const userInfo = await getDiscordUserInfo(access_token);
    if (!userInfo)
      return NextResponse.redirect(
        link
          ? profileLinkErrorUrl(request.url, "user_info_error", redirect)
          : new URL("/login?error=user_info_error", request.url),
      );

    const dcError = await dc_connection(userInfo);
    if (dcError)
      return NextResponse.redirect(
        link
          ? profileLinkErrorUrl(request.url, dcError, redirect)
          : new URL(`/login?error=${dcError}`, request.url),
      );

    if (link) {
      const session = await getSession();
      const result = await linkConnectionToSessionMember(session, {
        provider: "discord",
        id: userInfo.id,
      });
      if (!result.success) {
        return NextResponse.redirect(
          profileLinkErrorUrl(request.url, result.code, redirect),
        );
      }
      return NextResponse.redirect(
        profileLinkedUrl(request.url, "discord", redirect),
      );
    }

    const avatar = getDiscordAvatarUrl(userInfo.id, userInfo.avatar);

    const sessionData = {
      user: {
        id: userInfo.id,
        login: userInfo.username,
        name: userInfo.global_name ?? userInfo.username,
        email: userInfo.email ?? undefined,
        image: avatar,
      },
      accessToken: access_token,
      provider: "discord" as const,
    };

    const response = NextResponse.redirect(new URL(redirect, request.url));
    response.cookies.set("dc-session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in,
    });
    response.cookies.delete("42-session");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url),
    );
  }
}
