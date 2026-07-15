import {
  getFtUserByLogin,
  isBenGuerirCampus,
  isPooler,
  type FtUserProfile,
} from "@/lib/oauth";
import { getSession } from "@/lib/session";
import {
  canAccessDashboard,
  getUserByFtConnectionId,
} from "@/lib/users";
import { NextRequest, NextResponse } from "next/server";

export type PoolerProfileResponse = {
  profile: {
    id: number;
    login: string;
    name: string;
    email: string;
    avatar: string | null;
    wallet: number;
    correctionPoint: number;
    location: string | null;
    poolMonth: string | null;
    poolYear: string | null;
    campus: { id: number; name: string }[];
    cursus: {
      name: string;
      level: number;
      grade: string | null;
      beginAt: string | null;
      endAt: string | null;
      blackholedAt: string | null;
    }[];
    profileUrl: string;
    isBenGuerir: boolean;
    isPooler: boolean;
  };
};

function mapProfile(user: FtUserProfile): PoolerProfileResponse["profile"] {
  return {
    id: user.id,
    login: user.login,
    name: user.displayname || user.usual_full_name,
    email: user.email,
    avatar: user.image?.link ?? null,
    wallet: user.wallet,
    correctionPoint: user.correction_point,
    location: user.location,
    poolMonth: user.pool_month,
    poolYear: user.pool_year,
    campus: (user.campus ?? []).map((c) => ({ id: c.id, name: c.name })),
    cursus: (user.cursus_users ?? []).map((c) => ({
      name: c.cursus.name,
      level: c.level,
      grade: c.grade,
      beginAt: c.begin_at,
      endAt: c.end_at,
      blackholedAt: c.blackholed_at,
    })),
    profileUrl: `https://profile.intra.42.fr/users/${user.login}`,
    isBenGuerir: isBenGuerirCampus(user.campus),
    isPooler: isPooler(user),
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ login: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUser = await getUserByFtConnectionId(session.user.id);
  if (!canAccessDashboard(appUser?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { login } = await context.params;
  const cleaned = login?.trim();
  if (!cleaned) {
    return NextResponse.json({ error: "Login is required" }, { status: 400 });
  }

  try {
    const { user, status } = await getFtUserByLogin(cleaned);

    if (!user || status === 404) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (status !== 200) {
      return NextResponse.json(
        { error: "Failed to fetch user from 42 API" },
        { status: 502 },
      );
    }

    const profile = mapProfile(user);

    if (!profile.isBenGuerir) {
      return NextResponse.json(
        {
          error: "User is not registered at Ben Guerir campus",
          profile,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ profile } satisfies PoolerProfileResponse);
  } catch (error) {
    console.error("42 user lookup failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch user from 42 API" },
      { status: 500 },
    );
  }
}
