"use server";

import { requirePageAccess, requirePageEdit } from "@/lib/auth-guards";
import { fetchFtUserByLogin } from "@/lib/ft-api";
import {
  isListEntryPriority,
  resolveListEntryPriority,
  type ListEntryPriority,
} from "@/lib/list-entry";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type { ListEntryPriority };

export type ClubList = {
  id: string;
  name: string;
  created_at: string;
  entry_count: number;
};

export type ListEntryNote = {
  id: string;
  entry_id: string;
  member_id: number;
  body: string;
  created_at: string;
  updated_at: string;
  member_name: string;
  member_avatar: string | null;
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
  priority: ListEntryPriority;
  created_at: string;
  notes: ListEntryNote[];
};

export type ListProfileCard = {
  login: string;
  name: string;
  avatar: string | null;
  pool_year: number | null;
  campus: string | null;
};

const LIST_PATH = "/dashboard/lists";

const ENTRY_SELECT =
  "id, list_id, ft_id, login, name, avatar, pool_year, campus, priority, created_at";

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

function mapEntryRow(
  row: Record<string, unknown>,
  notes: ListEntryNote[] = [],
): ListEntry {
  return {
    id: row.id as string,
    list_id: row.list_id as string,
    ft_id: (row.ft_id as number | null) ?? null,
    login: row.login as string,
    name: row.name as string,
    avatar: (row.avatar as string | null) ?? null,
    pool_year: (row.pool_year as number | null) ?? null,
    campus: (row.campus as string | null) ?? null,
    priority: resolveListEntryPriority(row.priority),
    created_at: row.created_at as string,
    notes,
  };
}

async function loadNotesByEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryIds: string[],
): Promise<Map<string, ListEntryNote[]>> {
  const map = new Map<string, ListEntryNote[]>();
  if (entryIds.length === 0) return map;

  const { data, error } = await supabase
    .from("list_entry_notes")
    .select(
      "id, entry_id, member_id, body, created_at, updated_at, members(name, ft_connections(avatar), dc_connections(avatar), google_connections(avatar))",
    )
    .in("entry_id", entryIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching list entry notes:", error);
    return map;
  }

  for (const row of data ?? []) {
    const membersRaw = row.members;
    const member = Array.isArray(membersRaw) ? membersRaw[0] : membersRaw;
    const memberRow = member as
      | {
          name?: string | null;
          ft_connections?:
            | { avatar?: string | null }
            | { avatar?: string | null }[]
            | null;
          dc_connections?:
            | { avatar?: string | null }
            | { avatar?: string | null }[]
            | null;
          google_connections?:
            | { avatar?: string | null }
            | { avatar?: string | null }[]
            | null;
        }
      | null;

    const ftRaw = memberRow?.ft_connections;
    const dcRaw = memberRow?.dc_connections;
    const googleRaw = memberRow?.google_connections;
    const ft = Array.isArray(ftRaw) ? ftRaw[0] : ftRaw;
    const dc = Array.isArray(dcRaw) ? dcRaw[0] : dcRaw;
    const google = Array.isArray(googleRaw) ? googleRaw[0] : googleRaw;

    const note: ListEntryNote = {
      id: row.id as string,
      entry_id: row.entry_id as string,
      member_id: row.member_id as number,
      body: row.body as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      member_name: memberRow?.name?.trim() || "عضو",
      member_avatar:
        ft?.avatar ?? dc?.avatar ?? google?.avatar ?? null,
    };
    const list = map.get(note.entry_id) ?? [];
    list.push(note);
    map.set(note.entry_id, list);
  }

  return map;
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
        .select(ENTRY_SELECT)
        .eq("list_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (listError || entriesError || !list) {
    if (listError) console.error("Error fetching list:", listError);
    if (entriesError) console.error("Error fetching list entries:", entriesError);
    return null;
  }

  const rows = (entries ?? []) as Record<string, unknown>[];
  const notesByEntry = await loadNotesByEntry(
    supabase,
    rows.map((row) => row.id as string),
  );

  const mapped = rows.map((row) =>
    mapEntryRow(row, notesByEntry.get(row.id as string) ?? []),
  );

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
    .select(ENTRY_SELECT)
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
    existing: existing
      ? cardFromEntry(mapEntryRow(existing as Record<string, unknown>))
      : null,
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
      priority: "none",
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

export async function updateListEntryPriority(input: {
  listId: string;
  entryId: string;
  priority: ListEntryPriority;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit(LIST_PATH);
    if (!isListEntryPriority(input.priority)) {
      return { success: false, error: "أولوية غير صالحة" };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("list_entries")
      .update({ priority: input.priority })
      .eq("id", input.entryId)
      .eq("list_id", input.listId);

    if (error) {
      console.error("Error updating list entry priority:", error);
      return { success: false, error: "تعذر تحديث الأولوية" };
    }

    revalidateLists(input.listId);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function addListEntryNote(input: {
  listId: string;
  entryId: string;
  body: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { member } = await requirePageEdit(LIST_PATH);
    const body = input.body.trim();
    if (body.length < 1) return { success: false, error: "الملاحظة مطلوبة" };
    if (body.length > 2000) {
      return { success: false, error: "الملاحظة طويلة جداً" };
    }

    const supabase = await createClient();
    const { data: entry, error: entryError } = await supabase
      .from("list_entries")
      .select("id")
      .eq("id", input.entryId)
      .eq("list_id", input.listId)
      .maybeSingle();

    if (entryError || !entry) {
      return { success: false, error: "الحساب غير موجود في اللائحة" };
    }

    const { error } = await supabase.from("list_entry_notes").insert({
      entry_id: input.entryId,
      member_id: member.id,
      body,
    });

    if (error) {
      console.error("Error adding list entry note:", error);
      return { success: false, error: "تعذر إضافة الملاحظة" };
    }

    revalidateLists(input.listId);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function updateListEntryNote(input: {
  listId: string;
  noteId: string;
  body: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { member } = await requirePageEdit(LIST_PATH);
    const body = input.body.trim();
    if (body.length < 1) return { success: false, error: "الملاحظة مطلوبة" };
    if (body.length > 2000) {
      return { success: false, error: "الملاحظة طويلة جداً" };
    }

    const supabase = await createClient();
    const { data: note, error: noteError } = await supabase
      .from("list_entry_notes")
      .select("id, member_id, entry_id, list_entries!inner(list_id)")
      .eq("id", input.noteId)
      .maybeSingle();

    if (noteError || !note) {
      return { success: false, error: "الملاحظة غير موجودة" };
    }

    const entryRaw = note.list_entries;
    const entry = Array.isArray(entryRaw) ? entryRaw[0] : entryRaw;
    const listId = (entry as { list_id?: string } | null)?.list_id;
    if (listId !== input.listId) {
      return { success: false, error: "الملاحظة غير موجودة" };
    }

    if (note.member_id !== member.id) {
      return { success: false, error: "يمكنك تعديل ملاحظاتك فقط" };
    }

    const { error } = await supabase
      .from("list_entry_notes")
      .update({ body, updated_at: new Date().toISOString() })
      .eq("id", input.noteId);

    if (error) {
      console.error("Error updating list entry note:", error);
      return { success: false, error: "تعذر تعديل الملاحظة" };
    }

    revalidateLists(input.listId);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteListEntryNote(input: {
  listId: string;
  noteId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { member } = await requirePageEdit(LIST_PATH);
    const supabase = await createClient();
    const { data: note, error: noteError } = await supabase
      .from("list_entry_notes")
      .select("id, member_id, list_entries!inner(list_id)")
      .eq("id", input.noteId)
      .maybeSingle();

    if (noteError || !note) {
      return { success: false, error: "الملاحظة غير موجودة" };
    }

    const entryRaw = note.list_entries;
    const entry = Array.isArray(entryRaw) ? entryRaw[0] : entryRaw;
    const listId = (entry as { list_id?: string } | null)?.list_id;
    if (listId !== input.listId) {
      return { success: false, error: "الملاحظة غير موجودة" };
    }

    // Editors may delete any note; authors can delete their own.
    if (note.member_id !== member.id) {
      // requirePageEdit already ensures edit access / owner.
    }

    const { error } = await supabase
      .from("list_entry_notes")
      .delete()
      .eq("id", input.noteId);

    if (error) {
      console.error("Error deleting list entry note:", error);
      return { success: false, error: "تعذر حذف الملاحظة" };
    }

    revalidateLists(input.listId);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
