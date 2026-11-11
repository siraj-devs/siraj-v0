/** Arabic letters (incl. presentation forms) plus spaces and common name marks. */
const ARABIC_NAME_RE =
  /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;

/** Arabic script, whitespace, digits, and common punctuation for free-text fields. */
const ARABIC_INPUT_RE =
  /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s0-9٠-٩.,،؛:؟!?\-_()/\\«»"""']/g;

export function isArabicName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  return ARABIC_NAME_RE.test(trimmed);
}

/** Strip non-Arabic characters from an input/textarea value. */
export function filterArabicInput(value: string): string {
  return value.replace(ARABIC_INPUT_RE, "");
}

export function isValidPhone(phone: string): boolean {
  return phone.trim().length >= 8;
}
