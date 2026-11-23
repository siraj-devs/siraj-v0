import type { SessionPerson } from "@/app/actions/sessions";

export function sessionPersonKey(person: SessionPerson): string {
  return person.member_id != null
    ? `m${person.member_id}`
    : `l${person.login ?? person.name}`;
}
