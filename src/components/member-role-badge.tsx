import { StatusBadge, type BadgeTone } from "@/components/dashboard/status-badge";
import { MEMBER_ROLE_LABELS, type MemberRole } from "@/lib/member-role";
import {
  Crown,
  Medal,
  Shield,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export const MEMBER_ROLE_ICONS: Record<MemberRole, LucideIcon> = {
  owner: Crown,
  admin: Shield,
  participant: UserRound,
  veteran: Medal,
  newcomer: Sparkles,
};

export const MEMBER_ROLE_TONES: Record<MemberRole, BadgeTone> = {
  owner: "rose",
  admin: "amber",
  participant: "emerald",
  veteran: "sky",
  newcomer: "violet",
};

export function MemberRoleBadge({
  role,
  size = "md",
  iconOnly = false,
}: {
  role: MemberRole;
  size?: "sm" | "md";
  iconOnly?: boolean;
}) {
  const Icon = MEMBER_ROLE_ICONS[role];
  return (
    <StatusBadge
      tone={MEMBER_ROLE_TONES[role]}
      icon={<Icon className={size === "sm" ? "size-3" : "size-3.5"} />}
      label={MEMBER_ROLE_LABELS[role]}
      size={size}
      iconOnly={iconOnly}
    />
  );
}
