"use server";

import {
  getMemberForSession,
  isMemberProfileComplete,
  type AppMember,
} from "@/lib/members";
import {
  getPendingProfileRequestForSession,
  getProfileRequestsForDashboard,
  type ProfileChangeRequest,
} from "@/lib/profile-requests";
import { getSession } from "@/lib/session";
import { requireOwner } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { unlinkMemberConnection } from "@/lib/link-connection";
import { revalidatePath } from "next/cache";

function revalidateProfilePaths() {
  revalidatePath("/profile");
  revalidatePath("/courses");
  revalidatePath("/dashboard/profile-requests");
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

export async function getMyMemberProfile(): Promise<{
  member: AppMember | null;
  pendingRequest: ProfileChangeRequest | null;
  complete: boolean;
  ftConnection: MemberFtConnection | null;
  dcConnection: MemberDcConnection | null;
}> {
  const empty = {
    member: null,
    pendingRequest: null,
    complete: false,
    ftConnection: null,
    dcConnection: null,
  };

  const session = await getSession();
  if (!session) return empty;

  const member = await getMemberForSession(session);
  const pendingRequest = await getPendingProfileRequestForSession(session);

  if (!member) {
    return {
      ...empty,
      pendingRequest,
    };
  }

  const supabase = await createClient();
  const [ftRes, dcRes] = await Promise.all([
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
  ]);

  return {
    member,
    pendingRequest,
    complete: isMemberProfileComplete(member),
    ftConnection: (ftRes.data as MemberFtConnection | null) ?? null,
    dcConnection: (dcRes.data as MemberDcConnection | null) ?? null,
  };
}

export async function submitProfileChangeRequest(input: {
  name: string;
  email: string;
  phone: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "يجب تسجيل الدخول أولاً" };

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();

    if (!name) return { success: false, error: "الاسم مطلوب" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "البريد الإلكتروني غير صالح" };
    }
    if (phone.length < 8) {
      return { success: false, error: "رقم الهاتف غير صالح" };
    }

    const member = await getMemberForSession(session);
    if (member) {
      const sameAsCurrent =
        name === member.name.trim() &&
        email === (member.email ?? "").trim().toLowerCase() &&
        phone === (member.phone ?? "").trim();

      if (sameAsCurrent) {
        return { success: false, error: "لا توجد تغييرات لإرسالها" };
      }
    }

    const existing = await getPendingProfileRequestForSession(session);
    if (existing) {
      return {
        success: false,
        error: "لديك طلباً قيد المراجعة بالفعل. انتظر موافقة المالك",
      };
    }

    const isDiscord = session.provider === "discord";
    const ftConnectionId = isDiscord ? null : Number(session.user.id);
    if (!isDiscord && (!ftConnectionId || !Number.isFinite(ftConnectionId))) {
      return { success: false, error: "جلسة الدخول غير صالحة" };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("profile_change_requests").insert({
      member_id: member?.id ?? null,
      ft_connection: member ? null : ftConnectionId,
      dc_connection: member ? null : isDiscord ? session.user.id : null,
      requested_name: name,
      requested_email: email,
      requested_phone: phone,
      status: "pending",
    });

    if (error) {
      console.error("Error creating profile change request:", error);
      if (error.code === "23505") {
        return {
          success: false,
          error: "لديك طلباً قيد المراجعة بالفعل",
        };
      }
      return { success: false, error: "تعذر إرسال الطلب" };
    }

    revalidateProfilePaths();
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function listProfileChangeRequests(): Promise<
  ProfileChangeRequest[]
> {
  await requireOwner();
  return getProfileRequestsForDashboard();
}

export async function reviewProfileChangeRequest(input: {
  id: number;
  decision: "approved" | "rejected";
  rejection_note?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { member: owner } = await requireOwner();

    if (!input.id || !Number.isFinite(input.id)) {
      return { success: false, error: "معرّف غير صالح" };
    }

    const supabase = await createClient();
    const { data: request, error: fetchError } = await supabase
      .from("profile_change_requests")
      .select(
        "id, member_id, ft_connection, dc_connection, requested_name, requested_email, requested_phone, status",
      )
      .eq("id", input.id)
      .maybeSingle();

    if (fetchError || !request) {
      return { success: false, error: "الطلب غير موجود" };
    }
    if (request.status !== "pending") {
      return { success: false, error: "تمت مراجعة هذا الطلب مسبقاً" };
    }

    let memberId = request.member_id as number | null;

    if (input.decision === "approved") {
      if (memberId) {
        const { error: updateMemberError } = await supabase
          .from("members")
          .update({
            name: request.requested_name,
            email: request.requested_email,
            phone: request.requested_phone,
          })
          .eq("id", memberId);

        if (updateMemberError) {
          console.error(
            "Error updating member from request:",
            updateMemberError,
          );
          return { success: false, error: "تعذر تحديث بيانات العضو" };
        }
      } else {
        const { data: created, error: createError } = await supabase
          .from("members")
          .insert({
            name: request.requested_name,
            email: request.requested_email,
            phone: request.requested_phone,
            role: "newcomer",
            ft_connection: request.ft_connection,
            dc_connection: request.dc_connection,
          })
          .select("id")
          .single();

        if (createError || !created) {
          console.error("Error creating member from request:", createError);
          if (createError?.code === "23505") {
            return {
              success: false,
              error: "هذا الحساب مرتبط بعضو آخر",
            };
          }
          return { success: false, error: "تعذر إنشاء العضو" };
        }

        memberId = created.id;
      }
    }

    const { error: reviewError } = await supabase
      .from("profile_change_requests")
      .update({
        status: input.decision,
        member_id: memberId,
        reviewed_by: owner.id,
        reviewed_at: new Date().toISOString(),
        rejection_note:
          input.decision === "rejected"
            ? input.rejection_note?.trim() || null
            : null,
      })
      .eq("id", input.id);

    if (reviewError) {
      console.error("Error reviewing profile request:", reviewError);
      return { success: false, error: "تعذر حفظ قرار المراجعة" };
    }

    revalidateProfilePaths();
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function unlinkMyConnection(
  provider: "42" | "discord",
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
