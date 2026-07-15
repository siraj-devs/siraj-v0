// Simple 42 OAuth implementation without NextAuth
export const FT_OAUTH_CONFIG = {
  clientId: process.env.FT_CLIENT_ID!,
  clientSecret: process.env.FT_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/42`,
  authorizationUrl: "https://api.intra.42.fr/oauth/authorize",
  tokenUrl: "https://api.intra.42.fr/oauth/token",
  userInfoUrl: "https://api.intra.42.fr/v2/me",
  usersUrl: "https://api.intra.42.fr/v2/users",
};

/** 1337 Ben Guerir campus id on the 42 API */
export const BEN_GUERIR_CAMPUS_ID = 21;

export function get42AuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: FT_OAUTH_CONFIG.clientId,
    redirect_uri: FT_OAUTH_CONFIG.redirectUri,
    response_type: "code",
    scope: "public",
    ...(state && { state }),
  });

  const authUrl = `${FT_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
  return authUrl;
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

let appTokenCache: { token: string; expiresAt: number } | null = null;

export async function getFtAppAccessToken(): Promise<string> {
  if (appTokenCache && Date.now() < appTokenCache.expiresAt) {
    return appTokenCache.token;
  }

  const response = await fetch(FT_OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: FT_OAUTH_CONFIG.clientId,
      client_secret: FT_OAUTH_CONFIG.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get 42 application token");
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  appTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
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

export type FtCampus = {
  id: number;
  name: string;
};

export type FtCursusUser = {
  id: number;
  grade: string | null;
  level: number;
  begin_at: string | null;
  end_at: string | null;
  blackholed_at: string | null;
  cursus: {
    id: number;
    name: string;
    slug: string;
  };
};

export type FtUserProfile = {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  usual_full_name: string;
  displayname: string;
  image: { link: string | null } | null;
  correction_point: number;
  pool_month: string | null;
  pool_year: string | null;
  location: string | null;
  wallet: number;
  alumni: boolean;
  "staff?": boolean;
  campus: FtCampus[];
  cursus_users: FtCursusUser[];
};

export function isBenGuerirCampus(campus: FtCampus[] | undefined) {
  if (!campus?.length) return false;
  return campus.some(
    (c) =>
      c.id === BEN_GUERIR_CAMPUS_ID ||
      /ben\s*guerir|benguerir/i.test(c.name),
  );
}

export function isPooler(
  user: Pick<FtUserProfile, "cursus_users" | "pool_month" | "pool_year">,
) {
  const hasPoolDates = Boolean(user.pool_month && user.pool_year);
  const hasPiscineCursus = user.cursus_users?.some((c) =>
    /piscine|pool/i.test(c.cursus?.name ?? c.cursus?.slug ?? ""),
  );
  return hasPoolDates || hasPiscineCursus;
}

export async function getFtUserByLogin(
  login: string,
): Promise<{ user: FtUserProfile | null; status: number }> {
  const token = await getFtAppAccessToken();
  const response = await fetch(
    `${FT_OAUTH_CONFIG.usersUrl}/${encodeURIComponent(login.trim().toLowerCase())}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    },
  );

  if (response.status === 404) {
    return { user: null, status: 404 };
  }

  if (!response.ok) {
    return { user: null, status: response.status };
  }

  const user = (await response.json()) as FtUserProfile;
  return { user, status: 200 };
}
