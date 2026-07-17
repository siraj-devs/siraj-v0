// Simple 42 OAuth implementation without NextAuth
export const FT_OAUTH_CONFIG = {
  clientId: process.env.FT_CLIENT_ID!,
  clientSecret: process.env.FT_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/42`,
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

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
  secret_valid_until: number;
}> {
  const response = await fetch(FT_OAUTH_CONFIG.tokenUrl, {
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
    throw new Error("Failed to exchange code for token");
  }

  return response.json();
}

export async function getUserInfo(accessToken: string): Promise<{
  id: number;
  displayname: string;
  login: string;
  image?: { link: string };
} | null> {
  const response = await fetch(FT_OAUTH_CONFIG.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;

  return response.json();
}
