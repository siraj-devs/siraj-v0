import env from "@/env";
import { FT_OAUTH_CONFIG } from "@/lib/oauth";

export type FtUserLookup = {
  id: number;
  login: string;
  name: string;
  avatar: string | null;
  pool_year: number | null;
};

type FtTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type FtCursusUser = {
  begin_at?: string | null;
  cursus?: { name?: string | null } | null;
};

type FtUserResponse = {
  id: number;
  login: string;
  displayname?: string | null;
  usual_full_name?: string | null;
  image?: { link?: string | null } | null;
  pool_year?: string | number | null;
  cursus_users?: FtCursusUser[] | null;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

/** App-level Intra token (client credentials). Cached until near expiry. */
async function getClientCredentialsToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const response = await fetch(FT_OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.FT_CLIENT_ID,
      client_secret: env.FT_CLIENT_SECRET,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("تعذر الاتصال بواجهة 42");
  }

  const data = (await response.json()) as FtTokenResponse;
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

function parsePoolYear(raw: FtUserResponse): number | null {
  if (raw.pool_year != null && raw.pool_year !== "") {
    const year = Number(raw.pool_year);
    if (Number.isFinite(year) && year >= 2010 && year <= 2100) return year;
  }

  const begins = (raw.cursus_users ?? [])
    .map((c) => c.begin_at)
    .filter((v): v is string => Boolean(v))
    .map((iso) => new Date(iso).getFullYear())
    .filter((y) => Number.isFinite(y) && y >= 2010);

  if (begins.length === 0) return null;
  return Math.min(...begins);
}

/**
 * Look up a 42 user by login using the application client credentials.
 * Used by the Network feature when an owner adds someone by Intra login.
 */
export async function fetchFtUserByLogin(
  login: string,
): Promise<FtUserLookup | null> {
  const trimmed = login.trim().toLowerCase();
  if (!trimmed) return null;

  const token = await getClientCredentialsToken();
  const response = await fetch(
    `https://api.intra.42.fr/v2/users/${encodeURIComponent(trimmed)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("تعذر جلب بيانات المستخدم من 42");
  }

  const data = (await response.json()) as FtUserResponse;
  const name =
    data.displayname?.trim() ||
    data.usual_full_name?.trim() ||
    data.login;

  return {
    id: data.id,
    login: data.login,
    name,
    avatar: data.image?.link ?? null,
    pool_year: parsePoolYear(data),
  };
}
