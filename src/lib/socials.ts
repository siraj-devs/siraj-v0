import { createClient } from "@/lib/supabase/server";
import type { SocialLink } from "@/lib/social-platforms";

export type { SocialLink } from "@/lib/social-platforms";
export {
  getSocialDisplayName,
  isKnownSocialLabel,
  SOCIAL_PLATFORM_OPTIONS,
} from "@/lib/social-platforms";

export async function getSocialLinks(): Promise<SocialLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("socials")
    .select("label, link")
    .order("label", { ascending: true });

  if (error) {
    console.error("Error fetching socials:", error);
    return [];
  }

  return (data ?? []) as SocialLink[];
}
