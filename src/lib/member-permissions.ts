import {
  normalizePageGrants,
  type PageGrant,
} from "@/lib/page-permissions";
import { createClient } from "@/lib/supabase/server";

export async function getMemberPagePermissions(
  memberId: number,
): Promise<PageGrant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_page_permissions")
    .select("path, access")
    .eq("member_id", memberId);

  if (error) {
    console.error("Error fetching member page permissions:", error);
    return [];
  }

  return normalizePageGrants(data ?? []);
}

export async function getPagePermissionsByMember(): Promise<
  Map<number, PageGrant[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_page_permissions")
    .select("member_id, path, access");

  const map = new Map<number, PageGrant[]>();
  if (error) {
    console.error("Error fetching page permissions:", error);
    return map;
  }

  const grouped = new Map<number, { path: string; access: string }[]>();
  for (const row of data ?? []) {
    const list = grouped.get(row.member_id) ?? [];
    list.push({ path: row.path, access: row.access });
    grouped.set(row.member_id, list);
  }

  for (const [memberId, rows] of grouped) {
    map.set(memberId, normalizePageGrants(rows));
  }

  return map;
}

export async function setMemberPagePermissions(
  memberId: number,
  grants: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  const clean = normalizePageGrants(grants);
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
    clean.map((grant) => ({
      member_id: memberId,
      path: grant.path,
      access: grant.access,
    })),
  );

  if (error) {
    console.error("Error saving page permissions:", error);
    return { success: false, error: "تعذر حفظ الصلاحيات" };
  }

  return { success: true };
}
