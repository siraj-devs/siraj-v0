import env from "@/env";
import { signPlayAppRequest } from "@/lib/play-app/sign";
import {
  PLAY_APP_HEADERS,
  type CreateGameResponse,
  type GameSnapshot,
} from "@/types/game-snapshot";
import { z } from "zod";

export type PlayAppErrorKind =
  | "config"
  | "timeout"
  | "network"
  | "http"
  | "invalid_response";

export class PlayAppError extends Error {
  constructor(
    message: string,
    readonly kind: PlayAppErrorKind,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PlayAppError";
  }
}

const responseSchema = z.object({
  gameId: z.string().min(1).max(200),
  pin: z.string().min(1).max(32),
  hostUrl: z
    .url()
    .refine((value) => /^https?:\/\//i.test(value), "hostUrl must be http(s)"),
});

/** POST a signed snapshot to `${PLAY_APP_URL}/api/games`. Server-only. */
export async function createPlayGame(
  snapshot: GameSnapshot,
  idempotencyKey: string,
  { timeoutMs = 10_000 }: { timeoutMs?: number } = {},
): Promise<CreateGameResponse> {
  const baseUrl = env.PLAY_APP_URL;
  const secret = env.PLAY_APP_SHARED_SECRET;
  if (!baseUrl || !secret) {
    throw new PlayAppError(
      "PLAY_APP_URL / PLAY_APP_SHARED_SECRET are not configured",
      "config",
    );
  }

  const rawBody = JSON.stringify(snapshot);
  const timestamp = String(Date.now());
  const url = `${baseUrl.replace(/\/+$/, "")}/api/games`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [PLAY_APP_HEADERS.timestamp]: timestamp,
        [PLAY_APP_HEADERS.signature]: signPlayAppRequest(
          secret,
          timestamp,
          rawBody,
        ),
        [PLAY_APP_HEADERS.idempotencyKey]: idempotencyKey,
      },
      body: rawBody,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new PlayAppError(`Play app timed out after ${timeoutMs}ms`, "timeout");
    }
    throw new PlayAppError(
      `Play app unreachable: ${error instanceof Error ? error.message : String(error)}`,
      "network",
    );
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 500);
    throw new PlayAppError(
      `Play app responded ${response.status}: ${detail}`,
      "http",
      response.status,
    );
  }

  const body: unknown = await response.json().catch(() => null);
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    throw new PlayAppError("Play app returned an invalid body", "invalid_response");
  }
  return parsed.data;
}
