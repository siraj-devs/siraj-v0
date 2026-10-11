import env from "@/env";

// Simple 42 OAuth implementation without NextAuth
export const FT_OAUTH_CONFIG = {
  clientId: env.FT_CLIENT_ID,
  clientSecret: env.FT_CLIENT_SECRET,
  redirectUri: `${env.APP_URL}/api/auth/callback/42`,
  authorizationUrl: "https://api.intra.42.fr/oauth/authorize",
  tokenUrl: "https://api.intra.42.fr/oauth/token",
  userInfoUrl: "https://api.intra.42.fr/v2/me",
};

export function get42AuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: FT_OAUTH_CONFIG.clientId,
    redirect_uri: FT_OAUTH_CONFIG.redirectUri,
    response_type: "code",
    scope: "public",
    ...(state && { state }),
  });

  return `${FT_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
}

/** Logs status and body for a failed Intra response. Does not record secrets or tokens. */
export async function logFtApiError(label: string, response: Response) {
  let body = "";
  try {
    body = await response.text();
  } catch (error) {
    console.error(`[42] ${label} unreadable body`, response.status, error);
    return;
  }
  console.error(`[42] ${label}`, response.status, body.slice(0, 2000));
}

export async function ftFetch(
  label: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "siraj.club");
  }

  try {
    return await fetch(url, { ...init, headers });
  } catch (error) {
    console.error(`[42] ${label} network`, error);
    throw error;
  }
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
  secret_valid_until: number;
}> {
  const response = await ftFetch("token exchange", FT_OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: FT_OAUTH_CONFIG.clientId,
      client_secret: FT_OAUTH_CONFIG.clientSecret,
      code,
      redirect_uri: FT_OAUTH_CONFIG.redirectUri,
    }),
  });

  if (!response.ok) {
    await logFtApiError("token exchange", response);
    throw new Error(`42 token exchange failed: ${response.status}`);
  }

  return response.json();
}

export async function getUserInfo(accessToken: string): Promise<{
  id: number;
  displayname: string;
  login: string;
  image?: { link: string };
} | null> {
  const response = await ftFetch("user info", FT_OAUTH_CONFIG.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    await logFtApiError("user info", response);
    return null;
  }

  return response.json();
}
