"use server";

import { requireOwner } from "@/lib/auth-guards";
import {
  fetchFtUserByLogin,
  type FtUserKind,
  type FtUserLookup,
} from "@/lib/ft-api";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type NetworkRank = "A" | "B" | "C" | "D";
export type NetworkKind = FtUserKind;

export type NetworkProfile = {
  id: string;
  ft_id: number | null;
  login: string;
  name: string;
  avatar: string | null;
  pool_year: number | null;
  campus: string | null;
  kind: NetworkKind;
  rank: NetworkRank;
  created_at?: string;
  updated_at?: string;
  /** UI-only: has a row in members linked to this 42 identity */
  is_member: boolean;
  /** UI-only: has logged in / exists in ft_connections */
  has_connection: boolean;
};

const RANKS: NetworkRank[] = ["A", "B", "C", "D"];
const SELECT_COLS =
  "id, ft_id, login, name, avatar, pool_year, campus, kind, rank, created_at, updated_at";

function isRank(value: string): value is NetworkRank {
  return RANKS.includes(value as NetworkRank);
}

function isKind(value: string): value is NetworkKind {
  return value === "student" || value === "pooler";
}

function revalidateNetwork() {
  revalidatePath("/dashboard/network");
}

type NetworkRow = {
  id: string;
  ft_id: number | null;
  login: string;
  name: string;
  avatar: string | null;
  pool_year: number | null;
  campus: string | null;
  kind: string;
  rank: string;
  created_at?: string;
  updated_at?: string;
};

function toProfile(
  row: NetworkRow,
  flags: { is_member: boolean; has_connection: boolean } = {
    is_member: false,
    has_connection: false,
  },
): NetworkProfile {
  return {
    id: row.id,
    ft_id: row.ft_id,
    login: row.login,
    name: row.name,
    avatar: row.avatar,
    pool_year: row.pool_year,
    campus: row.campus,
    kind: isKind(row.kind) ? row.kind : "pooler",
    rank: isRank(row.rank) ? row.rank : "D",
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_member: flags.is_member,
    has_connection: flags.has_connection,
  };
}

function ftSnapshot(ftUser: FtUserLookup) {
  return {
    ft_id: ftUser.id,
    login: ftUser.login,
    name: ftUser.name,
    avatar: ftUser.avatar,
    pool_year: ftUser.pool_year,
    campus: ftUser.campus,
    kind: ftUser.kind,
    updated_at: new Date().toISOString(),
  };
}

export async function listNetworkProfiles(): Promise<NetworkProfile[]> {
  await requireOwner();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("network_profiles")
    .select(SELECT_COLS)
    .order("rank", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error listing network profiles:", error);
    throw new Error("تعذر جلب الشبكة");
  }

  const rows = (data ?? []) as NetworkRow[];
  if (rows.length === 0) return [];

  const ftIds = [
    ...new Set(
      rows.map((r) => r.ft_id).filter((id): id is number => id != null),
    ),
  ];
  const logins = [...new Set(rows.map((r) => r.login.toLowerCase()))];

  const connectionFilters = [
    ftIds.length > 0 ? `id.in.(${ftIds.join(",")})` : null,
    logins.length > 0 ? `login.in.(${logins.join(",")})` : null,
  ].filter(Boolean);

  const [{ data: connections }, { data: members }] = await Promise.all([
    connectionFilters.length > 0
      ? supabase
          .from("ft_connections")
          .select("id, login")
          .or(connectionFilters.join(","))
      : Promise.resolve({ data: [] as { id: number; login: string }[] }),
    supabase
      .from("members")
      .select("ft_connection")
      .not("ft_connection", "is", null),
  ]);

  const connectionById = new Map<number, string>();
  const connectionByLogin = new Map<string, number>();
  for (const c of connections ?? []) {
    const id = Number(c.id);
    const login = String(c.login).toLowerCase();
    connectionById.set(id, login);
    connectionByLogin.set(login, id);
  }

  const memberFtIds = new Set<number>();
  for (const m of members ?? []) {
    if (m.ft_connection != null) memberFtIds.add(Number(m.ft_connection));
  }

  return rows.map((row) => {
    const loginKey = row.login.toLowerCase();
    const connectedId =
      (row.ft_id != null && connectionById.has(row.ft_id)
        ? row.ft_id
        : null) ??
      connectionByLogin.get(loginKey) ??
      null;

    const has_connection = connectedId != null;
    const is_member =
      connectedId != null
        ? memberFtIds.has(connectedId)
        : row.ft_id != null
          ? memberFtIds.has(row.ft_id)
          : false;

    return toProfile(row, { is_member, has_connection });
  });
}

export async function addNetworkProfile(input: {
  login: string;
  rank: NetworkRank;
}): Promise<
  { success: true; profile: NetworkProfile } | { success: false; error: string }
> {
  try {
    await requireOwner();

    const login = input.login.trim().toLowerCase();
    if (!login) return { success: false, error: "حساب 42 مطلوب" };
    if (!isRank(input.rank)) return { success: false, error: "رتبة غير صالحة" };

    let ftUser;
    try {
      ftUser = await fetchFtUserByLogin(login);
    } catch (error) {
      console.error("42 lookup failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "تعذر جلب بيانات المستخدم",
      };
    }

    if (!ftUser) {
      return { success: false, error: "لم يُعثر على هذا الحساب في 42" };
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("network_profiles")
      .select("id")
      .or(`login.eq.${ftUser.login},ft_id.eq.${ftUser.id}`)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "هذا الحساب موجود مسبقاً في الشبكة" };
    }

    const { data, error } = await supabase
      .from("network_profiles")
      .insert({
        ...ftSnapshot(ftUser),
        rank: input.rank,
      })
      .select(SELECT_COLS)
      .single();

    if (error || !data) {
      console.error("Error creating network profile:", error);
      if (error?.code === "23505") {
        return { success: false, error: "هذا الحساب موجود مسبقاً في الشبكة" };
      }
      return { success: false, error: "تعذر إضافة الملف إلى الشبكة" };
    }

    revalidateNetwork();
    return { success: true, profile: toProfile(data as NetworkRow) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function updateNetworkProfile(input: {
  id: string;
  rank: NetworkRank;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();
    if (!input.id) return { success: false, error: "معرّف غير صالح" };
    if (!isRank(input.rank)) return { success: false, error: "رتبة غير صالحة" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("network_profiles")
      .update({
        rank: input.rank,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) {
      console.error("Error updating network profile:", error);
      return { success: false, error: "تعذر تحديث الرتبة" };
    }

    revalidateNetwork();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

/** Re-fetch name/avatar/year/campus/kind from Intra and overwrite the snapshot. */
export async function refreshNetworkProfile(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();
    if (!id) return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("network_profiles")
      .select("id, login")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "الملف غير موجود" };
    }

    let ftUser;
    try {
      ftUser = await fetchFtUserByLogin(existing.login);
    } catch (error) {
      console.error("42 refresh failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "تعذر جلب بيانات المستخدم",
      };
    }

    if (!ftUser) {
      return { success: false, error: "لم يُعثر على هذا الحساب في 42" };
    }

    const { error } = await supabase
      .from("network_profiles")
      .update(ftSnapshot(ftUser))
      .eq("id", id);

    if (error) {
      console.error("Error refreshing network profile:", error);
      return { success: false, error: "تعذر تحديث بيانات 42" };
    }

    revalidateNetwork();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function deleteNetworkProfile(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();
    if (!id) return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("network_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting network profile:", error);
      return { success: false, error: "تعذر حذف الملف من الشبكة" };
    }

    revalidateNetwork();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}
