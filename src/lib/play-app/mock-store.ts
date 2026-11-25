import type { CreateGameResponse, GameSnapshot } from "@/types/game-snapshot";

/** In-memory state for the dev-only mock play app (lost on server restart). */
type MockGame = {
  response: CreateGameResponse;
  bodyHash: string;
  snapshot: GameSnapshot;
  createdAt: number;
};

type MockStore = {
  byIdempotencyKey: Map<string, MockGame>;
  byGameId: Map<string, MockGame>;
};

const globalForMock = globalThis as typeof globalThis & {
  __mockPlayStore?: MockStore;
};

export function mockPlayStore(): MockStore {
  globalForMock.__mockPlayStore ??= {
    byIdempotencyKey: new Map(),
    byGameId: new Map(),
  };
  return globalForMock.__mockPlayStore;
}
