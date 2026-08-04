import { createClient } from "@/lib/supabase/server";
import type { SocialLink } from "@/lib/social-platforms";

export type { SocialLink } from "@/lib/social-platforms";
export {
  getSocialDisplayName,
  isKnownSocialLabel,
  SOCIAL_PLATFORM_OPTIONS,
} from "@/lib/social-platforms";

function mapSocial(row: {
  label: string;
  link: string;
  is_published?: boolean | null;
}): SocialLink {
  return {
    label: row.label,
    link: row.link,
    is_published: row.is_published !== false,
  };
}

/** Public footer: published links only. */
export async function getSocialLinks(): Promise<SocialLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("socials")
    .select("label, link, is_published")
    .eq("is_published", true)
    .order("label", { ascending: true });

  if (error) {
    console.error("Error fetching socials:", error);
    return [];
  }

  return (data ?? []).map(mapSocial);
}

/** Dashboard: all links including unpublished. */
export async function getSocialLinksForDashboard(): Promise<SocialLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("socials")
    .select("label, link, is_published")
    .order("label", { ascending: true });

  if (error) {
    console.error("Error fetching socials for dashboard:", error);
    return [];
  }

  return (data ?? []).map(mapSocial);
}
