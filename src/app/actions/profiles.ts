"use server";

import {
  canManageMembers,
  getMemberForSession,
  isMemberProfileComplete,
  type AppMember,
} from "@/lib/members";
import {
  getPendingProfileRequestForMember,
  getProfileRequestsForDashboard,
  type ProfileChangeRequest,
} from "@/lib/profile-requests";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidateProfilePaths() {
  revalidatePath("/profile");
  revalidatePath("/courses");
  revalidatePath("/dashboard/profile-requests");
  revalidatePath("/dashboard/members");
}

async function requireOwner() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const member = await getMemberForSession(session);
  if (!canManageMembers(member?.role)) throw new Error("غير مصرح");
  return { session, member: member! };
}

export async function getMyMemberProfile(): Promise<{
  member: AppMember | null;
  pendingRequest: ProfileChangeRequest | null;
  complete: boolean;
}> {
  const session = await getSession();
  if (!session) return { member: null, pendingRequest: null, complete: false };

  const member = await getMemberForSession(session);
  if (!member) return { member: null, pendingRequest: null, complete: false };

  const pendingRequest = await getPendingProfileRequestForMember(member.id);
  return {
    member,
    pendingRequest,
    complete: isMemberProfileComplete(member),
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

    const member = await getMemberForSession(session);
    if (!member) {
      return {
        success: false,
        error: "يجب أن تكون عضواً في النادي لتحديث الملف الشخصي",
      };
    }

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

    const sameAsCurrent =
      name === member.name.trim() &&
      email === (member.email ?? "").trim().toLowerCase() &&
      phone === (member.phone ?? "").trim();

    if (sameAsCurrent) {
      return { success: false, error: "لا توجد تغييرات لإرسالها" };
    }

    const existing = await getPendingProfileRequestForMember(member.id);
    if (existing) {
      return {
        success: false,
        error: "لديك طلباً قيد المراجعة بالفعل. انتظر موافقة المالك",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("profile_change_requests").insert({
      member_id: member.id,
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
        "id, member_id, requested_name, requested_email, requested_phone, status",
      )
      .eq("id", input.id)
      .maybeSingle();

    if (fetchError || !request) {
      return { success: false, error: "الطلب غير موجود" };
    }
    if (request.status !== "pending") {
      return { success: false, error: "تمت مراجعة هذا الطلب مسبقاً" };
    }

    if (input.decision === "approved") {
      const { error: updateMemberError } = await supabase
        .from("members")
        .update({
          name: request.requested_name,
          email: request.requested_email,
          phone: request.requested_phone,
        })
        .eq("id", request.member_id);

      if (updateMemberError) {
        console.error("Error updating member from request:", updateMemberError);
        return { success: false, error: "تعذر تحديث بيانات العضو" };
      }
    }

    const { error: reviewError } = await supabase
      .from("profile_change_requests")
      .update({
        status: input.decision,
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
