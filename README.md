# سراج (Siraj)

Club platform built with **Next.js**, **Supabase**, and **Bun**.

## Prerequisites

- [Bun](https://bun.sh/)
- [Docker](https://docs.docker.com/get-docker/) (for local Supabase)
- Accounts / apps for:
  - [42 OAuth](https://profile.intra.42.fr/oauth/applications)
  - [Discord OAuth](https://discord.com/developers/applications) (optional for Discord login)
  - Gmail App Password (optional — join emails)

## 1. Clone and install

```bash
git clone <repo-url> siraj-v0
cd siraj-v0
bun install
```

## 2. Environment

```bash
cp .env.example .env.local
```

Fill `.env.local` as you complete the steps below. Required variables:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | App origin (`http://localhost:3000` locally) |
| `FT_CLIENT_ID` / `FT_CLIENT_SECRET` | 42 OAuth |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable / anon key |
| `SUPABASE_SECRET_KEY` | Supabase service-role / secret key |

Optional SMTP (`ADMIN_EMAIL`, `SMTP_*`): if unset, join emails are skipped.

## 3. Database (local Supabase)

Preferred for development:

```bash
bun run db:start
```

When it finishes, `supabase status` prints local URLs and keys. Put them in `.env.local`, for example:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key from status>
SUPABASE_SECRET_KEY=<secret key from status>
```

Migrations under `supabase/migrations/` are applied on first start. If you add a new migration later:

```bash
bunx supabase db reset
# or apply SQL / repair as needed for your local state
```

Studio (optional): `http://127.0.0.1:54323`

Stop the stack:

```bash
bun run db:stop
```

### Remote Supabase (alternative)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **URL**, **publishable** key, and **secret** key into `.env.local`.
3. Apply migrations to the remote project (CLI link + push, or run SQL from `supabase/migrations/` in the SQL editor).

## 4. OAuth apps

Redirect URIs must match `APP_URL`.

### 42

1. [Intranet → Settings → API → New application](https://profile.intra.42.fr/oauth/applications)
2. Redirect URI: `http://localhost:3000/api/auth/callback/42`
3. Copy **UID** → `FT_CLIENT_ID`, **Secret** → `FT_CLIENT_SECRET`

Production redirect: `https://<your-domain>/api/auth/callback/42`

### Discord

1. [Discord Developer Portal](https://discord.com/developers/applications) → New Application → OAuth2
2. Redirect: `http://localhost:3000/api/auth/callback/discord`
3. Copy **Client ID** / **Client Secret** into `.env.local`

## 5. Email (optional)

For Gmail:

1. Enable 2-Step Verification → create an [App Password](https://myaccount.google.com/apppasswords)
2. Set in `.env.local`:

```env
ADMIN_EMAIL=you@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_16_char_app_password
```

## 6. Run the app

With Docker/Supabase already running:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
bun run build   # production build
bun run start   # serve production build
bun run lint    # eslint
```
