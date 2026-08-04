export const SOCIAL_PLATFORM_OPTIONS = [
  { label: "instagram", name: "إنستغرام" },
  { label: "discord", name: "ديسكورد" },
  { label: "whatsapp", name: "واتساب" },
  { label: "youtube", name: "يوتيوب" },
  { label: "facebook", name: "فيسبوك" },
  { label: "x", name: "إكس" },
  { label: "telegram", name: "تيليجرام" },
  { label: "linkedin", name: "لينكدإن" },
  { label: "tiktok", name: "تيك توك" },
] as const;

export type SocialLabel = (typeof SOCIAL_PLATFORM_OPTIONS)[number]["label"];

export type SocialLink = {
  label: string;
  link: string;
  is_published: boolean;
};

export function getSocialDisplayName(label: string) {
  return (
    SOCIAL_PLATFORM_OPTIONS.find((option) => option.label === label)?.name ??
    label
  );
}

export function isKnownSocialLabel(label: string): label is SocialLabel {
  return SOCIAL_PLATFORM_OPTIONS.some((option) => option.label === label);
}
