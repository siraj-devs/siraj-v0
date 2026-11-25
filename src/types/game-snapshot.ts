/**
 * Contract between the base app and the play app (play.<club> domain).
 *
 * The base app POSTs a `GameSnapshot` to `${PLAY_APP_URL}/api/games` when a
 * host starts a game. It is an immutable copy: the play app never reads the
 * base app's database. Keep this file dependency-free so it can move into a
 * shared package used by both apps.
 */

export type GameSnapshotQuestionType = "single_choice" | "true_false";

/**
 * - `standard`: correct answers earn up to `points`, faster answers earn more
 * - `fixed`: correct answers earn exactly `points`, regardless of speed
 * - `none`: practice mode, no scoring
 */
export type GameSnapshotPointsMode = "standard" | "fixed" | "none";

export type GameSnapshotSettings = {
  timePerQuestionSec: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  pointsMode: GameSnapshotPointsMode;
};

export type GameSnapshotOption = {
  id: string;
  /** 1-based. */
  position: number;
  text: string;
  isCorrect: boolean;
};

export type GameSnapshotQuestion = {
  id: string;
  /** 1-based. */
  position: number;
  type: GameSnapshotQuestionType;
  text: string;
  mediaUrl: string | null;
  /** Already resolved: the question override, or the template default. */
  timeLimitSec: number;
  points: number;
  explanation: string | null;
  options: GameSnapshotOption[];
};

export type GameSnapshot = {
  source: {
    app: "base";
    /** `game_sessions.id` in the base app. */
    sessionId: string;
    templateId: string;
    templateVersion: number;
  };
  host: {
    hostId: string;
    displayName: string;
  };
  settings: GameSnapshotSettings;
  title: string;
  questions: GameSnapshotQuestion[];
};

/** Successful response body of `POST /api/games`. */
export type CreateGameResponse = {
  gameId: string;
  pin: string;
  hostUrl: string;
};

/** Request headers sent with `POST /api/games`. */
export const PLAY_APP_HEADERS = {
  timestamp: "X-Timestamp",
  signature: "X-Signature",
  idempotencyKey: "Idempotency-Key",
} as const;
