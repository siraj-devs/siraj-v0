"use server";

import {
  getMemberForSession,
  isMemberProfileComplete,
  type AppMember,
} from "@/lib/members";
import { isArabicName, isValidPhone } from "@/lib/profile-fields";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { unlinkMemberConnection } from "@/lib/link-connection";
import { revalidatePath } from "next/cache";

function revalidateProfilePaths() {
  revalidatePath("/profile");
  revalidatePath("/courses");
  revalidatePath("/dashboard/members");
}

export type MemberFtConnection = {
  id: number;
  login: string;
  name: string | null;
  avatar: string | null;
};

export type MemberDcConnection = {
  id: string;
  username: string;
  avatar: string | null;
};

export type MemberGoogleConnection = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
};

export async function getMyMemberProfile(): Promise<{
  member: AppMember | null;
  complete: boolean;
  ftConnection: MemberFtConnection | null;
  dcConnection: MemberDcConnection | null;
  googleConnection: MemberGoogleConnection | null;
}> {
  const empty = {
    member: null,
    complete: false,
    ftConnection: null,
    dcConnection: null,
    googleConnection: null,
  };

  const session = await getSession();
  if (!session) return empty;

  const member = await getMemberForSession(session);

  if (!member) {
    return empty;
  }

  const supabase = await createClient();
  const [ftRes, dcRes, googleRes] = await Promise.all([
    member.ft_connection
      ? supabase
          .from("ft_connections")
          .select("id, login, name, avatar")
          .eq("id", member.ft_connection)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    member.dc_connection
      ? supabase
          .from("dc_connections")
          .select("id, username, avatar")
          .eq("id", member.dc_connection)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    member.google_connection
      ? supabase
          .from("google_connections")
          .select("id, email, name, avatar")
          .eq("id", member.google_connection)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    member,
    complete: isMemberProfileComplete(member),
    ftConnection: (ftRes.data as MemberFtConnection | null) ?? null,
    dcConnection: (dcRes.data as MemberDcConnection | null) ?? null,
    googleConnection: (googleRes.data as MemberGoogleConnection | null) ?? null,
  };
}

export async function saveMyProfile(input: {
  name: string;
  phone: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "يجب تسجيل الدخول أولاً" };

    const name = input.name.trim();
    const phone = input.phone.trim();

    if (!isArabicName(name)) {
      return {
        success: false,
        error: "الاسم يجب أن يكون بالعربية",
      };
    }
    if (!isValidPhone(phone)) {
      return { success: false, error: "رقم الهاتف غير صالح" };
    }

    const member = await getMemberForSession(session);
    const supabase = await createClient();

    if (member) {
      const sameAsCurrent =
        name === member.name.trim() &&
        phone === (member.phone ?? "").trim();

      if (sameAsCurrent) {
        return { success: true };
      }

      const phoneChanged = phone !== (member.phone ?? "").trim();
      const { error } = await supabase
        .from("members")
        .update({
          name,
          phone,
          ...(phoneChanged ? { phone_verified_at: null } : {}),
        })
        .eq("id", member.id);

      if (error) {
        console.error("Error updating member profile:", error);
        return { success: false, error: "تعذر حفظ الملف" };
      }

      revalidateProfilePaths();
      return { success: true };
    }

    const isDiscord = session.provider === "discord";
    const isGoogle = session.provider === "google";
    const ftConnectionId =
      isDiscord || isGoogle ? null : Number(session.user.id);
    if (
      !isDiscord &&
      !isGoogle &&
      (!ftConnectionId || !Number.isFinite(ftConnectionId))
    ) {
      return { success: false, error: "جلسة الدخول غير صالحة" };
    }

    const { error } = await supabase.from("members").insert({
      name,
      phone,
      role: "newcomer",
      ft_connection: ftConnectionId,
      dc_connection: isDiscord ? session.user.id : null,
      google_connection: isGoogle ? session.user.id : null,
      phone_verified_at: null,
    });

    if (error) {
      console.error("Error creating member profile:", error);
      if (error.code === "23505") {
        return {
          success: false,
          error: "هذا الحساب مرتبط بعضو آخر",
        };
      }
      return { success: false, error: "تعذر حفظ الملف" };
    }

    revalidateProfilePaths();
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function unlinkMyConnection(
  provider: "42" | "discord" | "google",
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    const result = await unlinkMemberConnection(session, provider);
    if (!result.success) return result;
    revalidateProfilePaths();
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}
