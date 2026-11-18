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

/** Single name part (first or last): Arabic letters, at least 2 chars. */
export function isArabicNamePart(value: string): boolean {
  return isArabicName(value);
}

export function composeMemberName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim().replace(/\s+/g, " ");
}

/** Split a stored full name into first + last (first token / remainder). */
export function splitMemberName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) return { first_name: "", last_name: "" };
  const space = trimmed.indexOf(" ");
  if (space < 0) return { first_name: trimmed, last_name: "" };
  return {
    first_name: trimmed.slice(0, space),
    last_name: trimmed.slice(space + 1).trim(),
  };
}

/** Strip non-Arabic characters from an input/textarea value. */
export function filterArabicInput(value: string): string {
  return value.replace(ARABIC_INPUT_RE, "");
}

export function isValidPhone(phone: string): boolean {
  return phone.trim().length >= 8;
}
