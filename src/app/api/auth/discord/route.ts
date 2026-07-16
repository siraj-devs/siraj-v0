import { getDiscordAuthUrl } from "@/lib/discord-oauth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    const authUrl = getDiscordAuthUrl(state || undefined);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Discord OAuth redirect error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_error", request.url),
    );
  }
}
