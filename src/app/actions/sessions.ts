"use server";

import { requirePageAccess, requirePageEdit } from "@/lib/auth-guards";
import { fetchFtUserByLogin } from "@/lib/ft-api";
import { createClient } from "@/lib/supabase/server";
import { isYoutubeUrl } from "@/lib/youtube";
import { revalidatePath } from "next/cache";

export type SessionSeries = {
  id: string;
  name: string;
  created_at?: string;
};

export type SessionPersonRole = "presenter" | "participant";

/** A presenter/participant: a club member, or an outside 42 login. */
export type SessionPerson = {
  member_id: number | null;
  login: string | null;
  name: string;
  avatar: string | null;
};

export type ClubSession = {
  id: string;
  thumbnail: string | null;
  title: string;
  due_date: string;
  record_link: string | null;
  series_id: string | null;
  series: SessionSeries | null;
  is_published: boolean;
  presenters: SessionPerson[];
  participants: SessionPerson[];
  created_at?: string;
  updated_at?: string;
};

export type SessionMemberOption = {
  id: number;
  name: string;
  login: string | null;
  avatar: string | null;
};

const SESSION_SELECT =
  "id, thumbnail, title, due_date, record_link, series_id, is_published, created_at, updated_at, session_series ( id, name )";

const PEOPLE_SELECT =
  "session_id, role, member_id, login, name, avatar, position, members ( name, ft_connections ( login, avatar ), dc_connections ( avatar ), google_connections ( avatar ) )";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type SessionRow = {
  id: string;
  thumbnail: string | null;
  title: string;
  due_date: string;
  record_link: string | null;
  series_id: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  session_series:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
};

function mapSeries(
  raw: SessionRow["session_series"],
): SessionSeries | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;
  return { id: row.id, name: row.name };
}

function mapSession(
  row: SessionRow,
  people?: { presenters: SessionPerson[]; participants: SessionPerson[] },
): ClubSession {
  return {
    id: row.id,
    thumbnail: row.thumbnail,
    title: row.title,
    due_date: row.due_date,
    record_link: row.record_link?.trim() || null,
    series_id: row.series_id,
    series: mapSeries(row.session_series),
    is_published: row.is_published === true,
    presenters: people?.presenters ?? [],
    participants: people?.participants ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function first<T>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

type AvatarRow = { avatar?: string | null };

function memberAvatar(member: Record<string, unknown> | null): string | null {
  if (!member) return null;
  return (
    first(member.ft_connections as AvatarRow | AvatarRow[] | null)?.avatar ??
    first(member.dc_connections as AvatarRow | AvatarRow[] | null)?.avatar ??
    first(member.google_connections as AvatarRow | AvatarRow[] | null)
      ?.avatar ??
    null
  );
}

async function loadPeopleBySession(
  supabase: SupabaseClient,
  sessionIds: string[],
): Promise<
  Map<string, { presenters: SessionPerson[]; participants: SessionPerson[] }>
> {
  const map = new Map<
    string,
    { presenters: SessionPerson[]; participants: SessionPerson[] }
  >();
  if (sessionIds.length === 0) return map;

  const { data, error } = await supabase
    .from("session_people")
    .select(PEOPLE_SELECT)
    .in("session_id", sessionIds)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching session people:", error);
    return map;
  }

  for (const row of data ?? []) {
    const member = first(
      row.members as Record<string, unknown> | Record<string, unknown>[] | null,
    );
    const ft = first(
      member?.ft_connections as
        | { login?: string | null }
        | { login?: string | null }[]
        | null,
    );
    const person: SessionPerson = {
      member_id: (row.member_id as number | null) ?? null,
      login: (row.login as string | null) ?? ft?.login ?? null,
      name: String(member?.name ?? "").trim() || (row.name as string),
      avatar: memberAvatar(member) ?? (row.avatar as string | null) ?? null,
    };
    const sessionId = row.session_id as string;
    const bucket = map.get(sessionId) ?? { presenters: [], participants: [] };
    if (row.role === "presenter") bucket.presenters.push(person);
    else bucket.participants.push(person);
    map.set(sessionId, bucket);
  }

  return map;
}

async function mapSessionsWithPeople(
  supabase: SupabaseClient,
  rows: SessionRow[],
): Promise<ClubSession[]> {
  const people = await loadPeopleBySession(
    supabase,
    rows.map((row) => row.id),
  );
  return rows.map((row) => mapSession(row, people.get(row.id)));
}

function revalidateSessions(id?: string) {
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/sessions");
  if (id) revalidatePath(`/sessions/${id}`);
}

export async function listSeries(): Promise<SessionSeries[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_series")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error listing session series:", error);
    throw new Error("تعذر جلب السلاسل");
  }

  return (data ?? []) as SessionSeries[];
}

export async function createSeries(
  name: string,
): Promise<
  { success: true; series: SessionSeries } | { success: false; error: string }
> {
  try {
    await requirePageEdit("/dashboard/sessions");
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "اسم السلسلة مطلوب" };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_series")
      .insert({ name: trimmed })
      .select("id, name, created_at")
      .single();

    if (error) {
      console.error("Error creating series:", error);
      if (error.code === "23505") {
        return { success: false, error: "السلسلة موجودة مسبقاً" };
      }
      return { success: false, error: "تعذر إنشاء السلسلة" };
    }

    revalidateSessions();
    return { success: true, series: data as SessionSeries };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function deleteSeries(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/sessions");
    if (!id) return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("session_series")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting series:", error);
      return { success: false, error: "تعذر حذف السلسلة" };
    }

    revalidateSessions();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

/** Public catalog: published sessions only. */
export async function getPublishedSessions(): Promise<ClubSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("is_published", true)
    .order("due_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching published sessions:", error);
    throw new Error("تعذر جلب الأمسيات");
  }

  return mapSessionsWithPeople(supabase, (data ?? []) as SessionRow[]);
}

export async function getPublishedSessionById(
  id: string,
): Promise<ClubSession | null> {
  if (!id) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching session:", error);
    throw new Error("تعذر جلب الأمسية");
  }

  if (!data) return null;
  const [session] = await mapSessionsWithPeople(supabase, [
    data as SessionRow,
  ]);
  return session ?? null;
}

/** Dashboard: all sessions including unpublished. */
export async function getSessionsForDashboard(): Promise<ClubSession[]> {
  await requirePageAccess("/dashboard/sessions");
  const includeDrafts = await canEditSessions();

  const supabase = await createClient();
  let query = supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .order("due_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (!includeDrafts) query = query.eq("is_published", true);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sessions for dashboard:", error);
    throw new Error("تعذر جلب الأمسيات");
  }

  return mapSessionsWithPeople(supabase, (data ?? []) as SessionRow[]);
}

/** Dashboard detail: one session including unpublished. */
export async function getSessionForDashboard(
  id: string,
): Promise<ClubSession | null> {
  await requirePageAccess("/dashboard/sessions");
  if (!id) return null;
  const includeDrafts = await canEditSessions();

  const supabase = await createClient();
  let query = supabase.from("sessions").select(SESSION_SELECT).eq("id", id);
  if (!includeDrafts) query = query.eq("is_published", true);
  const { data, error } = await query.maybeSingle();

  if (error) {
    // Invalid UUIDs surface as query errors; treat them as not found.
    if (error.code !== "22P02") {
      console.error("Error fetching session for dashboard:", error);
    }
    return null;
  }
  if (!data) return null;

  const [session] = await mapSessionsWithPeople(supabase, [
    data as SessionRow,
  ]);
  return session ?? null;
}

async function canEditSessions(): Promise<boolean> {
  try {
    await requirePageEdit("/dashboard/sessions");
    return true;
  } catch {
    return false;
  }
}

/**
 * Sessions dated within [startKey, endKeyExclusive) for the calendar.
 * Drafts are only included for members who can edit sessions.
 */
export async function listSessionsForRange(
  startKey: string,
  endKeyExclusive: string,
): Promise<ClubSession[]> {
  try {
    await requirePageAccess("/dashboard/calendar");
  } catch {
    return [];
  }
  const includeDrafts = await canEditSessions();

  const supabase = await createClient();
  let query = supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .gte("due_date", startKey)
    .lt("due_date", endKeyExclusive)
    .order("due_date", { ascending: true });
  if (!includeDrafts) query = query.eq("is_published", true);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching sessions for calendar:", error);
    return [];
  }

  return mapSessionsWithPeople(supabase, (data ?? []) as SessionRow[]);
}

export type MemberSessionItem = {
  id: string;
  title: string;
  due_date: string;
  thumbnail: string | null;
  is_published: boolean;
  series: SessionSeries | null;
  roles: SessionPersonRole[];
};

/**
 * Sessions a member presented or participated in. Also matches entries added
 * by 42 login before that login was linked to the member.
 */
export async function getMemberSessions(
  memberId: number,
): Promise<MemberSessionItem[]> {
  try {
    await requirePageAccess("/dashboard/members");
  } catch {
    return [];
  }
  if (!Number.isFinite(memberId)) return [];

  const supabase = await createClient();
  const { data: memberRow } = await supabase
    .from("members")
    .select("id, ft_connections ( login )")
    .eq("id", memberId)
    .maybeSingle();
  if (!memberRow) return [];

  const login = first(
    (memberRow as Record<string, unknown>).ft_connections as
      | { login?: string | null }
      | { login?: string | null }[]
      | null,
  )?.login?.toLowerCase();

  let peopleQuery = supabase
    .from("session_people")
    .select("session_id, role");
  peopleQuery = login
    ? peopleQuery.or(
        `member_id.eq.${memberId},and(member_id.is.null,login.eq.${login})`,
      )
    : peopleQuery.eq("member_id", memberId);

  const { data: links, error: linksError } = await peopleQuery;
  if (linksError) {
    console.error("Error fetching member session links:", linksError);
    return [];
  }

  const rolesBySession = new Map<string, Set<SessionPersonRole>>();
  for (const link of links ?? []) {
    const roles = rolesBySession.get(link.session_id as string) ?? new Set();
    roles.add(link.role === "presenter" ? "presenter" : "participant");
    rolesBySession.set(link.session_id as string, roles);
  }
  if (rolesBySession.size === 0) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .in("id", [...rolesBySession.keys()])
    .order("due_date", { ascending: false });
  if (error) {
    console.error("Error fetching member sessions:", error);
    return [];
  }

  return ((data ?? []) as SessionRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    due_date: row.due_date,
    thumbnail: row.thumbnail,
    is_published: row.is_published === true,
    series: mapSeries(row.session_series),
    roles: (["presenter", "participant"] as const).filter((role) =>
      rolesBySession.get(row.id)?.has(role),
    ),
  }));
}

/** Club members selectable as presenters/participants. */
export async function getSessionMemberOptions(): Promise<
  SessionMemberOption[]
> {
  await requirePageEdit("/dashboard/sessions");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select(
      "id, name, first_name, last_name, ft_connections ( login, avatar ), dc_connections ( avatar ), google_connections ( avatar )",
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching session member options:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const ft = first(
      record.ft_connections as
        | { login?: string | null }
        | { login?: string | null }[]
        | null,
    );
    const name =
      String(record.name ?? "").trim() ||
      [record.first_name, record.last_name]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(" ");
    return {
      id: record.id as number,
      name: name || ft?.login || `#${record.id}`,
      login: ft?.login ?? null,
      avatar: memberAvatar(record),
    };
  });
}

/**
 * Resolve a 42 login into a session person. Links to the club member when
 * that 42 account is connected to one.
 */
export async function lookupSessionPerson(
  login: string,
): Promise<
  { success: true; person: SessionPerson } | { success: false; error: string }
> {
  try {
    await requirePageEdit("/dashboard/sessions");
  } catch {
    return { success: false, error: "غير مصرح" };
  }

  const normalized = login.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,20}$/.test(normalized)) {
    return { success: false, error: "أدخل لوجين 42 صالحاً" };
  }

  const supabase = await createClient();
  const { data: memberRow } = await supabase
    .from("members")
    .select(
      "id, name, ft_connections!inner ( login, avatar ), dc_connections ( avatar ), google_connections ( avatar )",
    )
    .eq("ft_connections.login", normalized)
    .maybeSingle();

  if (memberRow) {
    const record = memberRow as Record<string, unknown>;
    return {
      success: true,
      person: {
        member_id: record.id as number,
        login: normalized,
        name: String(record.name ?? "").trim() || normalized,
        avatar: memberAvatar(record),
      },
    };
  }

  try {
    const ftUser = await fetchFtUserByLogin(normalized);
    if (!ftUser) {
      return { success: false, error: "لم يُعثر على هذا الحساب في 42" };
    }
    return {
      success: true,
      person: {
        member_id: null,
        login: ftUser.login.toLowerCase(),
        name: ftUser.name,
        avatar: ftUser.avatar,
      },
    };
  } catch (error) {
    console.error("[42] session person lookup", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "تعذر جلب بيانات المستخدم من 42",
    };
  }
}

async function uploadSessionThumbnail(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  if (!allowed.includes(file.type)) {
    throw new Error("صيغة الصورة غير مدعومة");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("حجم الصورة يجب أن يكون أقل من 5MB");
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from("sessions").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Error uploading session thumbnail:", error);
    throw new Error("تعذر رفع الصورة");
  }

  const { data } = supabase.storage.from("sessions").getPublicUrl(path);
  return data.publicUrl;
}

async function deleteStorageThumbnail(imageUrl: string | null) {
  if (!imageUrl) return;
  try {
    const marker = "/storage/v1/object/public/sessions/";
    const index = imageUrl.indexOf(marker);
    if (index === -1) return;
    const path = decodeURIComponent(imageUrl.slice(index + marker.length));
    const supabase = await createClient();
    await supabase.storage.from("sessions").remove([path]);
  } catch (error) {
    console.error("Error deleting session thumbnail:", error);
  }
}

type SessionPersonInput = SessionPerson & { role: SessionPersonRole };

function parsePeople(raw: FormDataEntryValue | null): SessionPersonInput[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const people: SessionPersonInput[] = [];
  for (const item of parsed.slice(0, 200)) {
    if (!item || typeof item !== "object") continue;
    const value = item as Record<string, unknown>;
    const role: SessionPersonRole =
      value.role === "presenter" ? "presenter" : "participant";
    const memberId = Number(value.member_id);
    const member_id =
      value.member_id != null && Number.isInteger(memberId) ? memberId : null;
    const loginRaw = String(value.login ?? "").trim().toLowerCase();
    const login = /^[a-z0-9-]{2,20}$/.test(loginRaw) ? loginRaw : null;
    if (member_id == null && !login) continue;

    const key = `${role}:${member_id != null ? `m${member_id}` : `l${login}`}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const avatarRaw = String(value.avatar ?? "").trim();
    people.push({
      role,
      member_id,
      login,
      name: String(value.name ?? "").trim().slice(0, 120) || login || "—",
      avatar: /^https:\/\//.test(avatarRaw) ? avatarRaw.slice(0, 500) : null,
    });
  }
  return people;
}

function parseSessionForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim();
  const record_link = String(formData.get("record_link") ?? "").trim();
  const seriesRaw = String(formData.get("series_id") ?? "").trim();
  const series_id = seriesRaw || null;
  const is_published = formData.get("is_published") !== "false";
  const thumbnailFile = formData.get("thumbnail");
  const people = parsePeople(formData.get("people"));

  return {
    title,
    due_date,
    record_link,
    series_id,
    is_published,
    thumbnailFile,
    people,
  };
}

function validateSessionFields(input: {
  title: string;
  due_date: string;
  record_link: string;
}): string | null {
  if (!input.title) return "العنوان مطلوب";
  if (!input.due_date) return "التاريخ مطلوب";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.due_date)) return "التاريخ غير صالح";
  if (input.record_link && !isYoutubeUrl(input.record_link)) {
    return "رابط يوتيوب غير صالح";
  }
  return null;
}

async function replaceSessionPeople(
  supabase: SupabaseClient,
  sessionId: string,
  people: SessionPersonInput[],
): Promise<boolean> {
  const { error: deleteError } = await supabase
    .from("session_people")
    .delete()
    .eq("session_id", sessionId);
  if (deleteError) {
    console.error("Error clearing session people:", deleteError);
    return false;
  }
  if (people.length === 0) return true;

  const positions = { presenter: 0, participant: 0 };
  const { error } = await supabase.from("session_people").insert(
    people.map((person) => ({
      session_id: sessionId,
      role: person.role,
      member_id: person.member_id,
      login: person.member_id != null ? null : person.login,
      name: person.name,
      avatar: person.avatar,
      position: positions[person.role]++,
    })),
  );
  if (error) {
    console.error("Error saving session people:", error);
    return false;
  }
  return true;
}

export async function createSession(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    await requirePageEdit("/dashboard/sessions");

    const fields = parseSessionForm(formData);
    const validationError = validateSessionFields(fields);
    if (validationError) return { success: false, error: validationError };

    let thumbnail: string | null = null;
    if (fields.thumbnailFile instanceof File && fields.thumbnailFile.size > 0) {
      thumbnail = await uploadSessionThumbnail(fields.thumbnailFile);
    }

    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from("sessions")
      .insert({
        title: fields.title,
        due_date: fields.due_date,
        record_link: fields.record_link || null,
        series_id: fields.series_id,
        is_published: fields.is_published,
        thumbnail,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !created) {
      console.error("Error creating session:", error);
      return { success: false, error: "تعذر إنشاء الأمسية" };
    }

    const savedPeople = await replaceSessionPeople(
      supabase,
      created.id as string,
      fields.people,
    );

    revalidateSessions(created.id as string);
    if (!savedPeople) {
      return {
        success: false,
        error: "تم إنشاء الأمسية لكن تعذر حفظ المقدمين والمشاركين",
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function updateSession(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    await requirePageEdit("/dashboard/sessions");

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { success: false, error: "معرّف غير صالح" };

    const fields = parseSessionForm(formData);
    const validationError = validateSessionFields(fields);
    if (validationError) return { success: false, error: validationError };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("sessions")
      .select("thumbnail")
      .eq("id", id)
      .maybeSingle();

    const payload: {
      title: string;
      due_date: string;
      record_link: string | null;
      series_id: string | null;
      is_published: boolean;
      updated_at: string;
      thumbnail?: string | null;
    } = {
      title: fields.title,
      due_date: fields.due_date,
      record_link: fields.record_link || null,
      series_id: fields.series_id,
      is_published: fields.is_published,
      updated_at: new Date().toISOString(),
    };

    if (fields.thumbnailFile instanceof File && fields.thumbnailFile.size > 0) {
      const uploaded = await uploadSessionThumbnail(fields.thumbnailFile);
      payload.thumbnail = uploaded;
      await deleteStorageThumbnail(existing?.thumbnail ?? null);
    } else if (formData.get("remove_thumbnail") === "true") {
      payload.thumbnail = null;
      await deleteStorageThumbnail(existing?.thumbnail ?? null);
    }

    const { error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Error updating session:", error);
      return { success: false, error: "تعذر تحديث الأمسية" };
    }

    const savedPeople = await replaceSessionPeople(supabase, id, fields.people);

    revalidateSessions(id);
    if (!savedPeople) {
      return { success: false, error: "تعذر حفظ المقدمين والمشاركين" };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function setSessionPublished(
  id: string,
  is_published: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/sessions");
    if (!id) return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("sessions")
      .update({
        is_published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating session publish state:", error);
      return { success: false, error: "تعذر تحديث حالة النشر" };
    }

    revalidateSessions(id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteSession(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePageEdit("/dashboard/sessions");
    if (!id) return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("sessions")
      .select("thumbnail")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("sessions").delete().eq("id", id);

    if (error) {
      console.error("Error deleting session:", error);
      return { success: false, error: "تعذر حذف الأمسية" };
    }

    await deleteStorageThumbnail(existing?.thumbnail ?? null);
    revalidateSessions(id);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
