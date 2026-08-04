"use server";

import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import {
  getSocialLinks,
  isKnownSocialLabel,
  type SocialLink,
} from "@/lib/socials";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const member = await getMemberForSession(session);
  if (!canManageMembers(member?.role)) throw new Error("غير مصرح");
  return { session, member };
}

function revalidateSocials() {
  revalidatePath("/dashboard/content");
  revalidatePath("/");
}

export async function getSocialsForDashboard(): Promise<SocialLink[]> {
  await requireOwner();
  return getSocialLinks();
}

export async function upsertSocialLink(input: {
  label: string;
  link: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();

    const label = input.label.trim().toLowerCase();
    const link = input.link.trim();

    if (!isKnownSocialLabel(label)) {
      return { success: false, error: "المنصة غير مدعومة" };
    }
    if (!/^https?:\/\//i.test(link)) {
      return { success: false, error: "الرابط يجب أن يبدأ بـ http:// أو https://" };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("socials").upsert(
      { label, link },
      { onConflict: "label" },
    );

    if (error) {
      console.error("Error upserting social:", error);
      if (error.code === "23514")
        return { success: false, error: "البيانات غير صالحة" };
      return { success: false, error: "تعذر حفظ الرابط" };
    }

    revalidateSocials();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteSocialLink(
  label: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();

    const normalized = label.trim().toLowerCase();
    if (!normalized) return { success: false, error: "المنصة غير صالحة" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("socials")
      .delete()
      .eq("label", normalized);

    if (error) {
      console.error("Error deleting social:", error);
      return { success: false, error: "تعذر حذف الرابط" };
    }

    revalidateSocials();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
