import type { NetworkRank } from "@/app/actions/network";

/** Display letter for ranks (stored as A–D). */
export const RANK_AR: Record<NetworkRank, string> = {
  A: "أ",
  B: "ب",
  C: "ج",
  D: "د",
};

const CAMPUS_AR: Record<string, string> = {
  benguerir: "ابن جرير",
  rabat: "الرباط",
  khouribga: "خريبكة",
  tetouan: "تطوان",
};

function normalizeCampus(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

/** Translate known Moroccan 42 campuses; otherwise keep Intra name. */
export function campusLabelAr(campus: string | null | undefined): string | null {
  if (!campus?.trim()) return null;
  const key = normalizeCampus(campus);
  const compact = key.replace(/\s+/g, "");
  return (
    CAMPUS_AR[key] ??
    CAMPUS_AR[compact] ??
    campus.trim()
  );
}
