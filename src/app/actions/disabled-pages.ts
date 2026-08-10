"use server";

import {
  getPublicPageStatuses,
  isProtectedFromDisable,
  normalizePublicPath,
  type PublicPageStatus,
} from "@/lib/disabled-pages";
import { requireOwner } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidateDisabledPages(path?: string) {
  revalidatePath("/dashboard/content");
  revalidatePath("/");
  if (path) revalidatePath(path);
}

export async function getDisabledPagesForDashboard(): Promise<PublicPageStatus[]> {
  await requireOwner();
  return getPublicPageStatuses();
}

export async function setPublicPageDisabledState(input: {
  path: string;
  disabled: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireOwner();

    const path = normalizePublicPath(input.path.trim());

    if (!path.startsWith("/") || path === "/") {
      return { success: false, error: "المسار غير صالح" };
    }
    if (isProtectedFromDisable(path)) {
      return { success: false, error: "لا يمكن تعطيل هذه الصفحة" };
    }

    const supabase = await createClient();
    const { error } = input.disabled
      ? await supabase.from("disabled_pages").upsert(
          {
            path,
          },
          { onConflict: "path" },
        )
      : await supabase.from("disabled_pages").delete().eq("path", path);

    if (error) {
      console.error("Error updating page state:", error);
      if (error.code === "23514")
        return { success: false, error: "المسار غير مسموح" };
      return {
        success: false,
        error: input.disabled ? "تعذر تعطيل الصفحة" : "تعذر تفعيل الصفحة",
      };
    }

    revalidateDisabledPages(path);
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}
