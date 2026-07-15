"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

type PoolerProfile = {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar: string | null;
  wallet: number;
  correctionPoint: number;
  location: string | null;
  poolMonth: string | null;
  poolYear: string | null;
  campus: { id: number; name: string }[];
  cursus: {
    name: string;
    level: number;
    grade: string | null;
    beginAt: string | null;
    endAt: string | null;
    blackholedAt: string | null;
  }[];
  profileUrl: string;
  isBenGuerir: boolean;
  isPooler: boolean;
};

function formatPool(month: string | null, year: string | null) {
  if (!month && !year) return "—";
  return [month, year].filter(Boolean).join(" ");
}

export default function DashboardPoolPage() {
  const [login, setLogin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PoolerProfile | null>(null);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    const query = login.trim().toLowerCase();
    if (!query) {
      setError("أدخل login للبحث");
      return;
    }

    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const response = await fetch(`/api/42/users/${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "تعذر جلب المستخدم");
        if (data.profile) setProfile(data.profile);
        return;
      }

      setProfile(data.profile);
    } catch {
      setError("حدث خطأ أثناء الاتصال بالـ API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="ltr" className="mx-auto w-full max-w-3xl space-y-8 p-4 md:p-6">
      <div>
        <h1 className="font-kufam text-2xl font-semibold text-foreground md:text-3xl">
          Pool — Ben Guerir
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search a 42 login and fetch their Intra profile (Ben Guerir campus).
        </p>
      </div>

      <form
        onSubmit={onSearch}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <Input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="login (e.g. jdoe)"
          className="font-mono"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={loading} className="sm:shrink-0">
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {profile && (
        <article className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
            <Link
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={`${profile.name} avatar`}
                  width={96}
                  height={96}
                  className="size-24 rounded-full border-2 border-primary/40 object-cover"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border-2 border-primary/40 bg-muted font-kufam text-2xl text-muted-foreground">
                  {profile.login.slice(0, 2).toUpperCase()}
                </div>
              )}
            </Link>

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h2 className="truncate text-xl font-semibold text-foreground">
                  {profile.name}
                </h2>
                <p className="font-mono text-sm text-muted-foreground">
                  @{profile.login}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.isBenGuerir && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                    Ben Guerir
                  </span>
                )}
                {profile.isPooler && (
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground/70">
                    Pooler
                  </span>
                )}
                {profile.location && (
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground/70">
                    {profile.location}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Pool</dt>
                  <dd className="mt-0.5 capitalize text-foreground">
                    {formatPool(profile.poolMonth, profile.poolYear)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Wallet</dt>
                  <dd className="mt-0.5 text-foreground">{profile.wallet}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Eval points</dt>
                  <dd className="mt-0.5 text-foreground">
                    {profile.correctionPoint}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-muted-foreground">Campus</dt>
                  <dd className="mt-0.5 text-foreground">
                    {profile.campus.map((c) => c.name).join(", ") || "—"}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 break-all text-foreground">
                    {profile.email}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {profile.cursus.length > 0 && (
            <div className="border-t border-border px-6 py-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Cursus
              </h3>
              <ul className="space-y-3">
                {profile.cursus.map((c) => (
                  <li
                    key={`${c.name}-${c.beginAt}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-muted-foreground">
                      lvl {c.level.toFixed(2)}
                      {c.grade ? ` · ${c.grade}` : ""}
                      {c.blackholedAt ? " · blackholed" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-border px-6 py-4">
            <Link
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary transition-colors hover:text-primary/80"
            >
              Open Intra profile →
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}
