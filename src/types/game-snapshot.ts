/**
 * Contract between the base app and the play app (play.<club> domain).
 *
 * The base app POSTs a `GameSnapshot` to `${PLAY_APP_URL}/api/games` when a
 * host starts a game. It is an immutable copy: the play app never reads the
 * base app's database. Keep this file dependency-free so it can move into a
 * shared package used by both apps.
 */

export type GameSnapshotQuestionType =
  | "single_choice"
  | "multi_choice"
  | "true_false"
  | "slider"
  | "puzzle";

/**
 * - `standard`: correct answers earn up to `points`, faster answers earn more
 * - `fixed`: correct answers earn exactly `points`, regardless of speed
 * - `none`: practice mode, no scoring
 */
export type GameSnapshotPointsMode = "standard" | "fixed" | "none";

export type GameSnapshotSettings = {
  timePerQuestionSec: number;
  shuffleQuestions: boolean;
  /** Choice questions only. Puzzle items are always shown shuffled. */
  shuffleOptions: boolean;
  pointsMode: GameSnapshotPointsMode;
};

export type GameSnapshotOption = {
  id: string;
  /** 1-based display order. */
  position: number;
  text: string;
  isCorrect: boolean;
};

export type GameSnapshotPuzzleItem = {
  id: string;
  /** 1-based position in the correct order. */
  position: number;
  text: string;
};

export type GameSnapshotSlider = {
  min: number;
  max: number;
  step: number;
  correctValue: number;
  /** Answers within ±tolerance of `correctValue` count as correct (0 = exact). */
  tolerance: number;
  /** Optional label shown next to the value (e.g. "kg", "سنة"). */
  unit: string | null;
};

type GameSnapshotQuestionBase = {
  id: string;
  /** 1-based. */
  position: number;
  text: string;
  mediaUrl: string | null;
  /** Already resolved: the question override, or the template default. */
  timeLimitSec: number;
  points: number;
  explanation: string | null;
};

export type GameSnapshotChoiceQuestion = GameSnapshotQuestionBase & {
  /**
   * - `single_choice` / `true_false`: exactly one option is correct; the
   *   player picks one.
   * - `multi_choice`: one or more options are correct; the player selects
   *   every option they think is correct.
   */
  type: "single_choice" | "multi_choice" | "true_false";
  /** 2–6 options (`true_false`: exactly 2). */
  options: GameSnapshotOption[];
};

export type GameSnapshotPuzzleQuestion = GameSnapshotQuestionBase & {
  /** The player drags the items into the correct order. */
  type: "puzzle";
  /** 3–6 items, listed in the correct order. Shuffle before showing. */
  items: GameSnapshotPuzzleItem[];
};

export type GameSnapshotSliderQuestion = GameSnapshotQuestionBase & {
  /** The player picks a number on a range. */
  type: "slider";
  slider: GameSnapshotSlider;
};

export type GameSnapshotQuestion =
  | GameSnapshotChoiceQuestion
  | GameSnapshotPuzzleQuestion
  | GameSnapshotSliderQuestion;

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
