import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]

export function toArabicIndic(value: number) {
  return String(value)
    .split("")
    .map((char) => ARABIC_INDIC_DIGITS[Number(char)] ?? char)
    .join("")
}
