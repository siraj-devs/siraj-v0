import { getGoogleAuthUrl } from "@/lib/google-oauth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    const authUrl = getGoogleAuthUrl(state || undefined);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google OAuth redirect error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_error", request.url),
    );
  }
}
