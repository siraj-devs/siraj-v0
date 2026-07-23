"use server";

import {
  canAccessDashboard,
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TransactionType = "income" | "expense";

export type ClubTransaction = {
  id: number;
  due_at: string;
  amount: number;
  type: TransactionType;
  note: string;
};

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

export async function getTransactions(): Promise<ClubTransaction[]> {
  await requireDashboardMember();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("id, due_at, amount, type, note")
    .order("due_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("تعذر جلب المعاملات");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    due_at: row.due_at,
    amount: Number(row.amount),
    type: row.type as TransactionType,
    note: row.note ?? "",
  }));
}

export async function createTransaction(input: {
  due_at: string;
  amount: number;
  type: TransactionType;
  note: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();

    const due_at = input.due_at?.trim();
    const note = input.note?.trim() ?? "";
    const amount = Number(input.amount);
    const type = input.type;

    if (!due_at) return { success: false, error: "تاريخ الاستحقاق مطلوب" };
    if (!type || (type !== "income" && type !== "expense"))
      return { success: false, error: "نوع المعاملة غير صالح" };
    if (!Number.isFinite(amount) || amount <= 0)
      return { success: false, error: "المبلغ يجب أن يكون أكبر من صفر" };
    if (note.length > 500)
      return { success: false, error: "الملاحظة طويلة جداً" };

    const supabase = await createClient();
    const { error } = await supabase.from("transactions").insert({
      due_at,
      amount,
      type,
      note,
    });

    if (error) {
      console.error("Error creating transaction:", error);
      return { success: false, error: "تعذر حفظ المعاملة" };
    }

    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteTransaction(
  id: number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();

    if (!id || !Number.isFinite(id))
      return { success: false, error: "معرّف غير صالح" };

    const supabase = await createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      console.error("Error deleting transaction:", error);
      return { success: false, error: "تعذر حذف المعاملة" };
    }

    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
