/** Arabic letters (incl. presentation forms) plus spaces and common name marks. */
const ARABIC_NAME_RE =
  /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;

export function isArabicName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  return ARABIC_NAME_RE.test(trimmed);
}

export function isValidPhone(phone: string): boolean {
  return phone.trim().length >= 8;
}
