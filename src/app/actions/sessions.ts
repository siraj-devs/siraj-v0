"use server";

import { requireDashboardMember, requireOwner } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { isYoutubeUrl } from "@/lib/youtube";
import { revalidatePath } from "next/cache";

export type SessionSeries = {
  id: string;
  name: string;
  created_at?: string;
};

export type ClubSession = {
  id: string;
  thumbnail: string | null;
  title: string;
  due_date: string;
  record_link: string;
  series_id: string | null;
  series: SessionSeries | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

const SESSION_SELECT =
  "id, thumbnail, title, due_date, record_link, series_id, is_published, created_at, updated_at, session_series ( id, name )";

type SessionRow = {
  id: string;
  thumbnail: string | null;
  title: string;
  due_date: string;
  record_link: string;
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

function mapSession(row: SessionRow): ClubSession {
  return {
    id: row.id,
    thumbnail: row.thumbnail,
    title: row.title,
    due_date: row.due_date,
    record_link: row.record_link,
    series_id: row.series_id,
    series: mapSeries(row.session_series),
    is_published: row.is_published === true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function revalidateSessions(id?: string) {
  revalidatePath("/dashboard/sessions");
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
    await requireOwner();
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
    await requireOwner();
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

  return ((data ?? []) as SessionRow[]).map(mapSession);
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

  return data ? mapSession(data as SessionRow) : null;
}

/** Dashboard: all sessions including unpublished. */
export async function getSessionsForDashboard(): Promise<ClubSession[]> {
  await requireDashboardMember();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .order("due_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sessions for dashboard:", error);
    throw new Error("تعذر جلب الأمسيات");
  }

  return ((data ?? []) as SessionRow[]).map(mapSession);
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

function parseSessionForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim();
  const record_link = String(formData.get("record_link") ?? "").trim();
  const seriesRaw = String(formData.get("series_id") ?? "").trim();
  const series_id = seriesRaw || null;
  const is_published = formData.get("is_published") !== "false";
  const thumbnailFile = formData.get("thumbnail");

  return {
    title,
    due_date,
    record_link,
    series_id,
    is_published,
    thumbnailFile,
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
  if (!input.record_link) return "رابط التسجيل مطلوب";
  if (!isYoutubeUrl(input.record_link)) {
    return "رابط يوتيوب غير صالح";
  }
  return null;
}

export async function createSession(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    await requireOwner();

    const fields = parseSessionForm(formData);
    const validationError = validateSessionFields(fields);
    if (validationError) return { success: false, error: validationError };

    let thumbnail: string | null = null;
    if (fields.thumbnailFile instanceof File && fields.thumbnailFile.size > 0) {
      thumbnail = await uploadSessionThumbnail(fields.thumbnailFile);
    }

    const supabase = await createClient();
    const { error } = await supabase.from("sessions").insert({
      title: fields.title,
      due_date: fields.due_date,
      record_link: fields.record_link,
      series_id: fields.series_id,
      is_published: fields.is_published,
      thumbnail,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating session:", error);
      return { success: false, error: "تعذر إنشاء الأمسية" };
    }

    revalidateSessions();
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
    await requireOwner();

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
      record_link: string;
      series_id: string | null;
      is_published: boolean;
      updated_at: string;
      thumbnail?: string | null;
    } = {
      title: fields.title,
      due_date: fields.due_date,
      record_link: fields.record_link,
      series_id: fields.series_id,
      is_published: fields.is_published,
      updated_at: new Date().toISOString(),
    };

    if (fields.thumbnailFile instanceof File && fields.thumbnailFile.size > 0) {
      const uploaded = await uploadSessionThumbnail(fields.thumbnailFile);
      payload.thumbnail = uploaded;
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

    revalidateSessions(id);
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
    await requireOwner();
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
    await requireOwner();
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
