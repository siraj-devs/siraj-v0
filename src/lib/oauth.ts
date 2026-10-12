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

// A browser-like UA from a datacenter IP triggers Cloudflare's JS challenge (403 "Just a moment...").
const FT_USER_AGENT = `siraj/1.0 (+${env.APP_URL})`;

/** Logs status and body for a failed Intra response. Does not record secrets or tokens. */
export async function logFtApiError(label: string, response: Response) {
  let body = "";
  try {
    body = await response.text();
  } catch (error) {
    console.error(`[42] ${label} unreadable body`, response.status, error);
    return "";
  }
  const authenticate = response.headers.get("www-authenticate");
  console.error(
    `[42] ${label}`,
    response.status,
    authenticate,
    body.slice(0, 2000),
  );
  return body;
}

export function ftFailureMessage(label: string, status: number, body: string) {
  const detail = body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return detail
    ? `42 ${label} failed: ${status} ${detail}`
    : `42 ${label} failed: ${status}`;
}

export async function ftFetch(
  label: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("User-Agent", FT_USER_AGENT);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

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
    const body = await logFtApiError("token exchange", response);
    throw new Error(ftFailureMessage("token exchange", response.status, body));
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
