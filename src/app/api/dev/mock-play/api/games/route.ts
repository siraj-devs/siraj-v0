import env from "@/env";
import { mockPlayStore } from "@/lib/play-app/mock-store";
import { verifyPlayAppSignature } from "@/lib/play-app/sign";
import {
  PLAY_APP_HEADERS,
  type CreateGameResponse,
  type GameSnapshot,
} from "@/types/game-snapshot";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * DEV ONLY: fake play app endpoint (`${PLAY_APP_URL}/api/games` with
 * PLAY_APP_URL=http://localhost:3000/api/dev/mock-play). Verifies the HMAC
 * signature like the real play app will. Delete once the play app exists.
 */
export async function POST(request: Request) {
  if (env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const secret = env.PLAY_APP_SHARED_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "PLAY_APP_SHARED_SECRET is not set" },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const valid = verifyPlayAppSignature({
    secret,
    timestamp: request.headers.get(PLAY_APP_HEADERS.timestamp),
    signature: request.headers.get(PLAY_APP_HEADERS.signature),
    rawBody,
  });
  if (!valid) {
    console.warn("[mock-play] rejected request: invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const idempotencyKey = request.headers.get(PLAY_APP_HEADERS.idempotencyKey);
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "missing Idempotency-Key" },
      { status: 400 },
    );
  }

  const store = mockPlayStore();
  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  const existing = store.byIdempotencyKey.get(idempotencyKey);
  if (existing) {
    if (existing.bodyHash !== bodyHash) {
      return NextResponse.json(
        { error: "Idempotency-Key reused with a different body" },
        { status: 422 },
      );
    }
    console.info(`[mock-play] replay for key ${idempotencyKey}`);
    return NextResponse.json(existing.response, { status: 200 });
  }

  let snapshot: GameSnapshot;
  try {
    snapshot = JSON.parse(rawBody) as GameSnapshot;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  console.info("[mock-play] received game snapshot:");
  console.dir(snapshot, { depth: null });

  const gameId = randomUUID();
  const response: CreateGameResponse = {
    gameId,
    pin: String(randomInt(100000, 1000000)),
    hostUrl: `${new URL(request.url).origin}/api/dev/mock-play/host/${gameId}`,
  };
  const game = { response, bodyHash, snapshot, createdAt: Date.now() };
  store.byIdempotencyKey.set(idempotencyKey, game);
  store.byGameId.set(gameId, game);

  return NextResponse.json(response, { status: 201 });
}
