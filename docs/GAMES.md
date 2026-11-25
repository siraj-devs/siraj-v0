# Game templates (live quizzes)

Members author Kahoot-style quiz templates at `/dashboard/games` and launch
live games on the separate **play app** (`play.<club domain>`). This repo only
handles authoring and launching; gameplay, player join, and realtime live in
the play app.

## Data model

Migrations: `supabase/migrations/20261125100000_game_templates.sql` and
`20261125140000_game_question_types.sql`.

- `game_templates`: title, description, cover, `default_settings`, `status`
  (`draft` | `ready`), `version` (bumped on every save), `created_by`.
- `game_questions`: type, text, image, optional time override, points,
  explanation, and `config` (slider settings).
- `game_question_options`: choice options or puzzle items, ordered by
  `position`.
- `game_sessions`: one row per launch attempt. Kept when a template is
  deleted (`template_id` becomes null).
- Storage bucket `games` for cover and question images.

Saves go through the `save_game_template` RPC, so the template, questions, and
options are written in one transaction and `version` is bumped. A save based on
an older version is rejected.

Drafts may be saved incomplete. `ready` templates must pass every rule below,
and only `ready` templates can be started.

## Question types

| Type | Player does | Authoring rules |
| --- | --- | --- |
| `single_choice` | picks one option | 2–6 options, exactly one correct |
| `multi_choice` | selects every correct option | 2–6 options, at least one correct |
| `true_false` | picks صح / خطأ | exactly 2 options, one correct |
| `slider` | picks a number on a range | `min < max`, `step > 0`, at most 1000 steps, answer on a step inside the range, `0 ≤ tolerance ≤ max − min` |
| `puzzle` | drags items into the correct order | 3–6 distinct, non-empty items, entered in the correct order |

All types: non-empty question text, time limit 5–120 s (or the template
default), points 0–2000.

Storage details: puzzle items are stored as options where `position` is the
correct order (`is_correct` is unused). Slider settings are stored in
`game_questions.config` as `{ min, max, step, correctValue, tolerance, unit }`.

## Access rules

`canManageGames` in `src/lib/games-access.ts` is the single rule, used by the
pages, the server actions, and the navigation. It sits on top of the existing
dashboard page grants for `/dashboard/games`:

| Permission | Allows | Granted by |
| --- | --- | --- |
| `games.view` | list templates, open them read-only | owner, or a "view" or "edit" grant |
| `games.manage` | create, edit, delete, duplicate, start | owner, or an "edit" grant |

By default only owners have access. Grant others from the member dialog
(صلاحيات الصفحات → الألعاب).

## Environment

| Variable | Purpose |
| --- | --- |
| `PLAY_APP_URL` | Play app origin. The base app POSTs to `${PLAY_APP_URL}/api/games`. |
| `PLAY_APP_SHARED_SECRET` | HMAC secret (≥ 32 chars) shared with the play app. |

Both are optional at boot; "Start game" shows an error until they are set.

### Local dev without the play app

A mock play app is built in and is disabled (404) when `NODE_ENV=production`:

```env
PLAY_APP_URL=http://localhost:3000/api/dev/mock-play
PLAY_APP_SHARED_SECRET=<openssl rand -hex 32>
```

It verifies the signature, logs the snapshot, returns a fake
`{ gameId, pin, hostUrl }` (same result for a repeated `Idempotency-Key`), and
serves a small host page at `hostUrl`. Delete `src/app/api/dev/mock-play` and
`src/lib/play-app/mock-store.ts` once the real play app exists.

## Start game contract

`POST ${PLAY_APP_URL}/api/games` with headers:

- `Content-Type: application/json`
- `X-Timestamp`: unix milliseconds
- `X-Signature`: hex `HMAC-SHA256(PLAY_APP_SHARED_SECRET, "${timestamp}.${rawBody}")`
  (see `src/lib/play-app/sign.ts`; reject if the timestamp is off by > 5 min)
- `Idempotency-Key`: the `game_sessions.idempotency_key`. The play app must
  return the same game for a repeated key.

The body is a `GameSnapshot` (`src/types/game-snapshot.ts`), an immutable copy
of the template at launch time; the play app never reads this database.
`timeLimitSec` is already resolved (question override or template default).
Positions are 1-based.

Each question has the common fields (`id`, `position`, `type`, `text`,
`mediaUrl`, `timeLimitSec`, `points`, `explanation`) plus one type-specific
field:

```jsonc
// single_choice | multi_choice | true_false
{ "type": "multi_choice", "options": [{ "id": "…", "position": 1, "text": "…", "isCorrect": true }] }

// puzzle: items listed in the correct order; shuffle before showing
{ "type": "puzzle", "items": [{ "id": "…", "position": 1, "text": "…" }] }

// slider: answers within ±tolerance of correctValue are correct
{ "type": "slider", "slider": { "min": 0, "max": 100, "step": 1, "correctValue": 42, "tolerance": 2, "unit": null } }
```

`settings.shuffleOptions` applies to choice questions only; puzzle items are
always shown shuffled.

Expected `2xx` response: `{ "gameId": string, "pin": string, "hostUrl": string }`.
The base app stores `play_game_id` / `pin`, marks the session `launched`, and
redirects the host to `hostUrl`. Timeouts (10 s), network errors, non-2xx, or
an invalid body mark the session `failed`.

**Retries:** the browser creates one idempotency key per "Start" click. If the
response is lost, retrying reuses the key, so no duplicate game is created.
After a definite failure, "Retry" starts a new attempt with a new key (and a
new session row), because the template may have changed in between.

`finished_at` and `results_summary` are reserved for a future results webhook
from the play app.
