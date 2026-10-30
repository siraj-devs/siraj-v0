import env from "@/env";

export const GOOGLE_OAUTH_CONFIG = {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${env.APP_URL}/api/auth/callback/google`,
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
};

export type GoogleUser = {
  id: string;
  email: string | null;
  name: string;
  login: string;
  avatar: string | null;
};

export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    ...(state && { state }),
  });

  return `${GOOGLE_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
}

export async function exchangeGoogleCodeForToken(code: string): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  id_token?: string;
}> {
  const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      code,
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to exchange Google code for token: ${response.status} ${body.slice(0, 160)}`,
    );
  }

  return response.json();
}

export async function getGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUser | null> {
  const response = await fetch(GOOGLE_OAUTH_CONFIG.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(
      "Google userinfo failed:",
      response.status,
      await response.text(),
    );
    return null;
  }

  const data = (await response.json()) as {
    sub?: string;
    email?: string | null;
    name?: string | null;
    picture?: string | null;
  };

  if (!data.sub) return null;

  const email = data.email?.trim() || null;
  const name = data.name?.trim() || email || "Google user";
  const login =
    email?.split("@")[0]?.trim() ||
    data.sub.slice(0, 12);

  return {
    id: data.sub,
    email,
    name,
    login,
    avatar: data.picture?.trim() || null,
  };
}
