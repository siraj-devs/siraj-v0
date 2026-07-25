"use server";

import {
  canAccessDashboard,
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProgramLinks = {
  telegram?: string | null;
  website?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  youtube?: string | null;
};

export type ProposedProgram = {
  id: number;
  name: string;
  description: string;
  order: number;
  image: string | null;
  links: ProgramLinks;
};

const LINK_KEYS = [
  "telegram",
  "website",
  "facebook",
  "twitter",
  "instagram",
  "whatsapp",
  "youtube",
] as const;

function normalizeLinks(input: ProgramLinks | null | undefined): ProgramLinks {
  const links: ProgramLinks = {};
  for (const key of LINK_KEYS) {
    const value = input?.[key]?.trim();
    if (value) links[key] = value;
  }
  return links;
}

function mapRow(row: {
  id: number;
  name: string;
  description: string;
  order: number;
  image: string | null;
  links: ProgramLinks | null;
}): ProposedProgram {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    order: Number(row.order) || 0,
    image: row.image,
    links: normalizeLinks(row.links ?? {}),
  };
}

async function requireDashboardMember() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const member = await getMemberForSession(session);
  if (!canAccessDashboard(member?.role)) throw new Error("غير مصرح");
  return { session, member };
}

async function requireOwner() {
  const ctx = await requireDashboardMember();
  if (!canManageMembers(ctx.member?.role)) throw new Error("غير مصرح");
  return ctx;
}

function revalidateContent() {
  revalidatePath("/dashboard/content");
  revalidatePath("/");
}

export async function getProposedPrograms(): Promise<ProposedProgram[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposed_programs")
    .select("id, name, description, order, image, links")
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching proposed programs:", error);
    throw new Error("تعذر جلب البرامج المقترحة");
  }

  return (data ?? []).map(mapRow);
}

export async function getProposedProgramsForDashboard(): Promise<
  ProposedProgram[]
> {
  await requireDashboardMember();
  return getProposedPrograms();
}

async function uploadProgramImage(file: File): Promise<string | null> {
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
  const { error } = await supabase.storage
    .from("proposed-programs")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Error uploading program image:", error);
    throw new Error("تعذر رفع الصورة");
  }

  const { data } = supabase.storage
    .from("proposed-programs")
    .getPublicUrl(path);

  return data.publicUrl;
}

async function deleteStorageImage(imageUrl: string | null) {
  if (!imageUrl) return;
  try {
    const marker = "/storage/v1/object/public/proposed-programs/";
    const index = imageUrl.indexOf(marker);
    if (index === -1) return;
    const path = decodeURIComponent(imageUrl.slice(index + marker.length));
    const supabase = await createClient();
    await supabase.storage.from("proposed-programs").remove([path]);
  } catch (error) {
    console.error("Error deleting program image:", error);
  }
}

export async function createProposedProgram(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    await requireOwner();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const order = Number(formData.get("order") ?? 0);
    const imageFile = formData.get("image");
    const links = normalizeLinks({
      telegram: String(formData.get("telegram") ?? ""),
      website: String(formData.get("website") ?? ""),
      facebook: String(formData.get("facebook") ?? ""),
      twitter: String(formData.get("twitter") ?? ""),
      instagram: String(formData.get("instagram") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      youtube: String(formData.get("youtube") ?? ""),
    });

    if (!name) return { success: false, error: "الاسم مطلوب" };
    if (!description) return { success: false, error: "الوصف مطلوب" };
    if (!Number.isFinite(order))
      return { success: false, error: "الترتيب غير صالح" };

    let image: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      image = await uploadProgramImage(imageFile);
    }

    const supabase = await createClient();
    const { error } = await supabase.from("proposed_programs").insert({
      name,
      description,
      order,
      image,
      links,
    });

    if (error) {
      console.error("Error creating proposed program:", error);
      return { success: false, error: "تعذر إنشاء البرنامج" };
    }

    revalidateContent();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function updateProposedProgram(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    await requireOwner();

    const id = Number(formData.get("id"));
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const order = Number(formData.get("order") ?? 0);
    const imageFile = formData.get("image");
    const links = normalizeLinks({
      telegram: String(formData.get("telegram") ?? ""),
      website: String(formData.get("website") ?? ""),
      facebook: String(formData.get("facebook") ?? ""),
      twitter: String(formData.get("twitter") ?? ""),
      instagram: String(formData.get("instagram") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      youtube: String(formData.get("youtube") ?? ""),
    });

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };
    if (!name) return { success: false, error: "الاسم مطلوب" };
    if (!description) return { success: false, error: "الوصف مطلوب" };
    if (!Number.isFinite(order))
      return { success: false, error: "الترتيب غير صالح" };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("proposed_programs")
      .select("image")
      .eq("id", id)
      .maybeSingle();

    const payload: {
      name: string;
      description: string;
      order: number;
      links: ProgramLinks;
      image?: string | null;
    } = { name, description, order, links };

    if (imageFile instanceof File && imageFile.size > 0) {
      const uploaded = await uploadProgramImage(imageFile);
      payload.image = uploaded;
      await deleteStorageImage(existing?.image ?? null);
    }

    const { error } = await supabase
      .from("proposed_programs")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Error updating proposed program:", error);
      return { success: false, error: "تعذر تحديث البرنامج" };
    }

    revalidateContent();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "غير مصرح",
    };
  }
}

export async function deleteProposedProgram(
  id: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("proposed_programs")
      .select("image")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase
      .from("proposed_programs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting proposed program:", error);
      return { success: false, error: "تعذر حذف البرنامج" };
    }

    await deleteStorageImage(existing?.image ?? null);
    revalidateContent();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
