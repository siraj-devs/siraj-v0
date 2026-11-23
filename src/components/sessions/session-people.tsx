"use client";

import {
  lookupSessionPerson,
  type SessionMemberOption,
  type SessionPerson,
} from "@/app/actions/sessions";
import { RemoteAvatar } from "@/components/remote-avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sessionPersonKey } from "@/lib/session-people";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Plus, Search, Users, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

export function PersonAvatar({
  person,
  className,
}: {
  person: SessionPerson;
  className?: string;
}) {
  const size = className ?? "size-6";
  return (
    <RemoteAvatar
      src={person.avatar}
      alt={person.name}
      className={cn(size, "shrink-0 rounded-full object-cover")}
      fallback={
        <span
          className={cn(
            size,
            "flex shrink-0 items-center justify-center rounded-full bg-muted font-kufam text-[10px] text-muted-foreground",
          )}
        >
          {person.name.slice(0, 1)}
        </span>
      }
    />
  );
}

/** Compact read-only chips: avatar + name. */
export function SessionPeopleChips({
  people,
  max,
  className,
}: {
  people: SessionPerson[];
  max?: number;
  className?: string;
}) {
  if (people.length === 0) return null;
  const shown = max != null ? people.slice(0, max) : people;
  const rest = people.length - shown.length;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((person) => (
        <span
          key={sessionPersonKey(person)}
          title={person.login ? `@${person.login}` : person.name}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted/60 py-0.5 ps-0.5 pe-2.5 text-xs text-foreground ring-1 ring-inset ring-border/70"
        >
          <PersonAvatar person={person} className="size-5" />
          <span className="truncate">{person.name}</span>
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-inset ring-border/70">
          +{rest}
        </span>
      )}
    </div>
  );
}

/** Overlapping avatars (max 4) with a +N overflow; names on hover. */
export function SessionAvatarStack({
  people,
  max = 4,
}: {
  people: SessionPerson[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5 rtl:space-x-reverse">
      {shown.map((person) => (
        <span
          key={sessionPersonKey(person)}
          title={person.name}
          className="rounded-full ring-2 ring-background"
        >
          <PersonAvatar person={person} className="size-7" />
        </span>
      ))}
      {rest > 0 && (
        <span
          title={people
            .slice(max)
            .map((person) => person.name)
            .join("، ")}
          className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground ring-2 ring-background"
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

/** Presenters | participants avatar groups for session cards and rows. */
export function SessionPeopleSummary({
  presenters,
  participants,
  className,
}: {
  presenters: SessionPerson[];
  participants: SessionPerson[];
  className?: string;
}) {
  if (presenters.length === 0 && participants.length === 0) return null;

  const groups = [
    { key: "presenters", label: "المقدّمون", icon: Mic, people: presenters },
    {
      key: "participants",
      label: "المشاركون",
      icon: Users,
      people: participants,
    },
  ].filter((group) => group.people.length > 0);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2",
        className,
      )}
    >
      {groups.map(({ key, label, icon: Icon, people }, index) => (
        <div key={key} className="flex items-center gap-3">
          {index > 0 && (
            <span aria-hidden className="h-6 w-px bg-border" />
          )}
          <div className="flex items-center gap-1.5" title={label}>
            <Icon
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-label={label}
            />
            <SessionAvatarStack people={people} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Pick people from club members, or add anyone by 42 login. */
export function SessionPeopleField({
  id,
  label,
  hideLabel = false,
  emptyText = "لم يُضف أحد بعد.",
  people,
  onChange,
  members,
  disabled,
}: {
  id: string;
  label: string;
  hideLabel?: boolean;
  emptyText?: string;
  people: SessionPerson[];
  onChange: (next: SessionPerson[]) => void;
  members: SessionMemberOption[];
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [looking, startLookup] = useTransition();

  const selectedKeys = useMemo(
    () => new Set(people.map(sessionPersonKey)),
    [people],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((member) => !selectedKeys.has(`m${member.id}`))
      .filter(
        (member) =>
          member.name.toLowerCase().includes(q) ||
          (member.login?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 6);
  }, [members, query, selectedKeys]);

  const loginCandidate = query.trim().replace(/^@/, "").toLowerCase();
  const canLookup = /^[a-z0-9-]{2,20}$/.test(loginCandidate);
  const showLookupRow =
    canLookup && !matches.some((member) => member.login === loginCandidate);
  const optionCount = matches.length + (showLookupRow ? 1 : 0);
  const showMenu = open && query.trim().length > 0;

  function add(person: SessionPerson) {
    if (selectedKeys.has(sessionPersonKey(person))) {
      toast.info("مضاف مسبقاً");
      return;
    }
    onChange([...people, person]);
    setQuery("");
    setActive(0);
  }

  function pick(index: number) {
    if (index < matches.length) addMember(matches[index]);
    else if (showLookupRow) addByLogin();
  }

  function addMember(member: SessionMemberOption) {
    add({
      member_id: member.id,
      login: member.login,
      name: member.name,
      avatar: member.avatar,
    });
  }

  function addByLogin() {
    if (!canLookup) return;
    const member = members.find((m) => m.login === loginCandidate);
    if (member) {
      addMember(member);
      return;
    }
    startLookup(async () => {
      const result = await lookupSessionPerson(loginCandidate);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      add(result.person);
    });
  }

  function remove(key: string) {
    onChange(people.filter((person) => sessionPersonKey(person) !== key));
  }

  const busy = disabled || looking;
  const optionClass = (index: number) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm transition",
      index === active ? "bg-muted" : "hover:bg-muted/60",
    );

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
      </Label>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && optionCount > 0) {
              e.preventDefault();
              setActive((i) => (i + 1) % optionCount);
            } else if (e.key === "ArrowUp" && optionCount > 0) {
              e.preventDefault();
              setActive((i) => (i - 1 + optionCount) % optionCount);
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (optionCount > 0) pick(Math.min(active, optionCount - 1));
            } else if (e.key === "Escape" && query) {
              e.stopPropagation();
              setQuery("");
            }
          }}
          placeholder="ابحث باسم العضو أو اكتب لوجين 42…"
          autoComplete="off"
          disabled={busy}
          role="combobox"
          aria-expanded={showMenu}
          className="bg-background pr-9 pl-10"
        />
        {looking && (
          <Loader2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {showMenu && (
          <div
            // Keep focus in the input so clicks register before blur closes the menu.
            onMouseDown={(e) => e.preventDefault()}
            className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
          >
            {optionCount === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">
                لا أعضاء مطابقون. اكتب لوجين 42 صالحاً لإضافته.
              </p>
            ) : (
              <ul role="listbox" className="max-h-60 overflow-y-auto p-1">
                {matches.map((member, index) => (
                  <li key={member.id} role="option" aria-selected={index === active}>
                    <button
                      type="button"
                      onClick={() => addMember(member)}
                      onMouseEnter={() => setActive(index)}
                      className={optionClass(index)}
                    >
                      <PersonAvatar
                        person={{
                          member_id: member.id,
                          login: member.login,
                          name: member.name,
                          avatar: member.avatar,
                        }}
                        className="size-7"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {member.name}
                      </span>
                      {member.login && (
                        <span
                          dir="ltr"
                          className="text-xs text-muted-foreground"
                        >
                          @{member.login}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
                {showLookupRow && (
                  <li
                    role="option"
                    aria-selected={active === matches.length}
                    className={cn(matches.length > 0 && "mt-1 border-t border-border/60 pt-1")}
                  >
                    <button
                      type="button"
                      onClick={addByLogin}
                      onMouseEnter={() => setActive(matches.length)}
                      className={optionClass(matches.length)}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                        42
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        إضافة من 42{" "}
                        <span dir="ltr" className="font-medium">
                          @{loginCandidate}
                        </span>
                      </span>
                      <Plus className="size-3.5 text-muted-foreground" />
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {people.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background/60 px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {people.map((person) => {
            const key = sessionPersonKey(person);
            const isMember = person.member_id != null;
            return (
              <li
                key={key}
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border/70 bg-background px-2.5 py-2"
              >
                <PersonAvatar person={person} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {person.name}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className={cn(
                        "rounded px-1 py-px ring-1 ring-inset",
                        isMember
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                          : "bg-slate-50 text-slate-700 ring-slate-200",
                      )}
                    >
                      {isMember ? "عضو" : "42"}
                    </span>
                    {person.login && (
                      <span dir="ltr" className="truncate">
                        @{person.login}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(key)}
                  aria-label={`إزالة ${person.name}`}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
