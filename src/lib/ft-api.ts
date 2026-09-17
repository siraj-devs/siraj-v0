import env from "@/env";
import { FT_OAUTH_CONFIG } from "@/lib/oauth";

export type FtUserKind = "student" | "pooler";

export type FtUserLookup = {
  id: number;
  login: string;
  name: string;
  avatar: string | null;
  /** Year from main cursus when present, else piscine / pool_year */
  pool_year: number | null;
  campus: string | null;
  kind: FtUserKind;
};

type FtTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type FtCampus = {
  id?: number;
  name?: string | null;
};

type FtCampusUser = {
  campus_id?: number;
  is_primary?: boolean;
};

type FtCursusUser = {
  begin_at?: string | null;
  end_at?: string | null;
  cursus?: {
    id?: number;
    name?: string | null;
    slug?: string | null;
  } | null;
  /** Present on some Intra payloads; preferred when available */
  campus?: FtCampus | null;
};

type FtUserResponse = {
  id: number;
  login: string;
  displayname?: string | null;
  usual_full_name?: string | null;
  image?: { link?: string | null } | null;
  pool_year?: string | number | null;
  cursus_users?: FtCursusUser[] | null;
  campus?: FtCampus[] | null;
  campus_users?: FtCampusUser[] | null;
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

function isPiscineCursus(c: FtCursusUser): boolean {
  const name = (c.cursus?.name ?? "").toLowerCase();
  const slug = (c.cursus?.slug ?? "").toLowerCase();
  return (
    name.includes("piscine") ||
    slug.includes("piscine") ||
    slug === "c-piscine"
  );
}

function yearFromIso(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const year = new Date(iso).getFullYear();
  return Number.isFinite(year) && year >= 2010 && year <= 2100 ? year : null;
}

function yearFromPoolField(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const year = Number(raw);
  return Number.isFinite(year) && year >= 2010 && year <= 2100 ? year : null;
}

/** Prefer active (no end_at), then earliest begin_at. */
function pickCursus(list: FtCursusUser[]): FtCursusUser | null {
  if (list.length === 0) return null;
  const active = list.filter((c) => !c.end_at);
  const pool = active.length > 0 ? active : list;
  return [...pool].sort((a, b) => {
    const ta = a.begin_at ? Date.parse(a.begin_at) : Number.POSITIVE_INFINITY;
    const tb = b.begin_at ? Date.parse(b.begin_at) : Number.POSITIVE_INFINITY;
    return ta - tb;
  })[0];
}

function campusFromUser(raw: FtUserResponse): string | null {
  const campuses = raw.campus ?? [];
  if (campuses.length === 0) return null;

  const primaryId = raw.campus_users?.find((c) => c.is_primary)?.campus_id;
  if (primaryId != null) {
    const match = campuses.find((c) => c.id === primaryId);
    if (match?.name?.trim()) return match.name.trim();
  }

  return campuses[0]?.name?.trim() || null;
}

/**
 * Campus + year: cursus first, then pool fields / user campus.
 * Kind: student if a non-piscine cursus exists, else pooler.
 */
function parseFtIdentity(raw: FtUserResponse): {
  pool_year: number | null;
  campus: string | null;
  kind: FtUserKind;
} {
  const cursusUsers = raw.cursus_users ?? [];
  const mainList = cursusUsers.filter((c) => !isPiscineCursus(c));
  const poolList = cursusUsers.filter(isPiscineCursus);
  const main = pickCursus(mainList);
  const piscine = pickCursus(poolList);

  const kind: FtUserKind = main ? "student" : "pooler";
  const preferred = main ?? piscine;

  const pool_year =
    yearFromIso(preferred?.begin_at) ??
    yearFromIso(piscine?.begin_at) ??
    yearFromPoolField(raw.pool_year);

  const campus =
    preferred?.campus?.name?.trim() ||
    piscine?.campus?.name?.trim() ||
    campusFromUser(raw);

  return { pool_year, campus, kind };
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
  const identity = parseFtIdentity(data);

  return {
    id: data.id,
    login: data.login,
    name,
    avatar: data.image?.link ?? null,
    pool_year: identity.pool_year,
    campus: identity.campus,
    kind: identity.kind,
  };
}
