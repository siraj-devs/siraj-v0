import {
  normalizePagePermissions,
  type DashboardPagePath,
} from "@/lib/page-permissions";
import { createClient } from "@/lib/supabase/server";

export async function getMemberPagePermissions(
  memberId: number,
): Promise<DashboardPagePath[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_page_permissions")
    .select("path")
    .eq("member_id", memberId);

  if (error) {
    console.error("Error fetching member page permissions:", error);
    return [];
  }

  return normalizePagePermissions((data ?? []).map((row) => row.path));
}

export async function getPagePermissionsByMember(): Promise<
  Map<number, DashboardPagePath[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_page_permissions")
    .select("member_id, path");

  const map = new Map<number, DashboardPagePath[]>();
  if (error) {
    console.error("Error fetching page permissions:", error);
    return map;
  }

  for (const row of data ?? []) {
    const path = normalizePagePermissions([row.path])[0];
    if (!path) continue;
    const list = map.get(row.member_id) ?? [];
    list.push(path);
    map.set(row.member_id, list);
  }

  return map;
}

export async function setMemberPagePermissions(
  memberId: number,
  paths: readonly string[],
): Promise<{ success: true } | { success: false; error: string }> {
  const clean = normalizePagePermissions([...paths]);
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("member_page_permissions")
    .delete()
    .eq("member_id", memberId);

  if (deleteError) {
    console.error("Error clearing page permissions:", deleteError);
    return { success: false, error: "تعذر حفظ الصلاحيات" };
  }

  if (clean.length === 0) return { success: true };

  const { error } = await supabase.from("member_page_permissions").insert(
    clean.map((path) => ({
      member_id: memberId,
      path,
    })),
  );

  if (error) {
    console.error("Error saving page permissions:", error);
    return { success: false, error: "تعذر حفظ الصلاحيات" };
  }

  return { success: true };
}
