"use server";

import { requirePageAccess, requirePageEdit } from "@/lib/auth-guards";
import { fetchFtUserByLogin } from "@/lib/ft-api";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ClubList = {
  id: string;
  name: string;
  created_at: string;
  entry_count: number;
};

export type ListEntry = {
  id: string;
  list_id: string;
  ft_id: number | null;
  login: string;
  name: string;
  avatar: string | null;
  pool_year: number | null;
  campus: string | null;
  created_at: string;
};

export type ListProfileCard = {
  login: string;
  name: string;
  avatar: string | null;
  pool_year: number | null;
  campus: string | null;
};

const LIST_PATH = "/dashboard/lists";

function revalidateLists(listId?: string) {
  revalidatePath(LIST_PATH);
  if (listId) revalidatePath(`${LIST_PATH}/${listId}`);
}

function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

function cardFromEntry(entry: ListEntry): ListProfileCard {
  return {
    login: entry.login,
    name: entry.name,
    avatar: entry.avatar,
    pool_year: entry.pool_year,
    campus: entry.campus,
  };
}

export async function listClubLists(): Promise<ClubList[]> {
  await requirePageAccess(LIST_PATH);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, created_at, list_entries(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching lists:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const countRaw = row.list_entries;
    const countRow = Array.isArray(countRaw) ? countRaw[0] : countRaw;
    return {
      id: row.id as string,
      name: row.name as string,
      created_at: row.created_at as string,
      entry_count: Number(countRow?.count) || 0,
    };
  });
}

export async function getClubList(id: string): Promise<{
  list: ClubList;
  entries: ListEntry[];
} | null> {
  await requirePageAccess(LIST_PATH);
  const supabase = await createClient();
  const [{ data: list, error: listError }, { data: entries, error: entriesError }] =
    await Promise.all([
      supabase.from("lists").select("id, name, created_at").eq("id", id).maybeSingle(),
      supabase
        .from("list_entries")
        .select(
          "id, list_id, ft_id, login, name, avatar, pool_year, campus, created_at",
        )
        .eq("list_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (listError || entriesError || !list) {
    if (listError) console.error("Error fetching list:", listError);
    if (entriesError) console.error("Error fetching list entries:", entriesError);
    return null;
  }

  const mapped = (entries ?? []) as ListEntry[];
  return {
    list: {
      id: list.id as string,
      name: list.name as string,
      created_at: list.created_at as string,
      entry_count: mapped.length,
    },
    entries: mapped,
  };
}

export async function createClubList(
  name: string,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    await requirePageEdit(LIST_PATH);
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "اسم اللائحة مطلوب" };
    if (trimmed.length > 80) {
      return { success: false, error: "اسم اللائحة طويل جداً" };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lists")
      .insert({ name: trimmed })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error creating list:", error);
      return { success: false, error: "تعذر إنشاء اللائحة" };
    }

    revalidateLists();
    return { success: true, id: data.id as string };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteClubList(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit(LIST_PATH);
    const supabase = await createClient();
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) {
      console.error("Error deleting list:", error);
      return { success: false, error: "تعذر حذف اللائحة" };
    }
    revalidateLists(id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function updateClubList(
  id: string,
  name: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit(LIST_PATH);
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "اسم اللائحة مطلوب" };
    if (trimmed.length > 80) {
      return { success: false, error: "اسم اللائحة طويل جداً" };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("lists")
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error updating list:", error);
      return { success: false, error: "تعذر تعديل اسم اللائحة" };
    }

    revalidateLists(id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

async function resolveListProfile(listId: string, login: string) {
  const normalized = normalizeLogin(login);
  if (!/^[a-z0-9-]{2,20}$/.test(normalized)) {
    return { ok: false as const, error: "أدخل لوجين 42 صالحاً" };
  }

  let ftUser;
  try {
    ftUser = await fetchFtUserByLogin(normalized);
  } catch (error) {
    console.error("[42] list lookup", error);
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "تعذر جلب بيانات المستخدم من 42",
    };
  }
  if (!ftUser) {
    return { ok: false as const, error: "لم يُعثر على هذا الحساب في 42" };
  }

  const profile: ListProfileCard = {
    login: ftUser.login,
    name: ftUser.name,
    avatar: ftUser.avatar,
    pool_year: ftUser.pool_year,
    campus: ftUser.campus,
  };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("list_entries")
    .select(
      "id, list_id, ft_id, login, name, avatar, pool_year, campus, created_at",
    )
    .eq("list_id", listId)
    .or(`login.eq.${ftUser.login},ft_id.eq.${ftUser.id}`)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking list entry:", existingError);
    return { ok: false as const, error: "تعذر التحقق من اللائحة" };
  }

  return {
    ok: true as const,
    supabase,
    ftUser,
    profile,
    existing: existing ? cardFromEntry(existing as ListEntry) : null,
  };
}

export async function lookupListProfile(
  listId: string,
  login: string,
): Promise<
  | { success: true; status: "available" | "already"; profile: ListProfileCard }
  | { success: false; error: string }
> {
  try {
    await requirePageEdit(LIST_PATH);
    const resolved = await resolveListProfile(listId, login);
    if (!resolved.ok) return { success: false, error: resolved.error };
    if (resolved.existing) {
      return { success: true, status: "already", profile: resolved.existing };
    }
    return { success: true, status: "available", profile: resolved.profile };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function addListProfile(
  listId: string,
  login: string,
): Promise<
  | { success: true; status: "added" | "already"; profile: ListProfileCard }
  | { success: false; error: string }
> {
  try {
    await requirePageEdit(LIST_PATH);
    const resolved = await resolveListProfile(listId, login);
    if (!resolved.ok) return { success: false, error: resolved.error };
    if (resolved.existing) {
      return { success: true, status: "already", profile: resolved.existing };
    }

    const { supabase, ftUser, profile } = resolved;
    const { error } = await supabase.from("list_entries").insert({
      list_id: listId,
      ft_id: ftUser.id,
      login: ftUser.login.toLowerCase(),
      name: ftUser.name,
      avatar: ftUser.avatar,
      pool_year: ftUser.pool_year,
      campus: ftUser.campus,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: true, status: "already", profile };
      }
      console.error("Error adding list entry:", error);
      return { success: false, error: "تعذر إضافة الحساب إلى اللائحة" };
    }

    await supabase
      .from("lists")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", listId);

    revalidateLists(listId);
    return { success: true, status: "added", profile };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function removeListEntry(
  listId: string,
  entryId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit(LIST_PATH);
    const supabase = await createClient();
    const { error } = await supabase
      .from("list_entries")
      .delete()
      .eq("id", entryId)
      .eq("list_id", listId);
    if (error) {
      console.error("Error removing list entry:", error);
      return { success: false, error: "تعذر إزالة الحساب من اللائحة" };
    }
    revalidateLists(listId);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
