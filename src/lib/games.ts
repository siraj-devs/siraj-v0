import type {
  GameSnapshotPointsMode,
  GameSnapshotQuestionType,
  GameSnapshotSettings,
} from "@/types/game-snapshot";
import { z } from "zod";

/** Shared (client + server) game template types, defaults, and validation. */

export type GameQuestionType = GameSnapshotQuestionType;
export type GamePointsMode = GameSnapshotPointsMode;
export type GameSettings = GameSnapshotSettings;
export type GameTemplateStatus = "draft" | "ready";
export type GameSessionStatus = "launching" | "launched" | "failed" | "finished";

export const GAME_LIMITS = {
  titleMax: 120,
  descriptionMax: 1000,
  questionTextMax: 300,
  optionTextMax: 120,
  explanationMax: 500,
  urlMax: 2048,
  questionsMax: 100,
  optionsMin: 2,
  optionsMax: 4,
  timeMinSec: 5,
  timeMaxSec: 120,
  pointsMax: 2000,
} as const;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timePerQuestionSec: 20,
  shuffleQuestions: false,
  shuffleOptions: false,
  pointsMode: "standard",
};

export const DEFAULT_QUESTION_POINTS = 1000;

export const GAME_QUESTION_TYPE_LABELS: Record<GameQuestionType, string> = {
  single_choice: "اختيار من متعدد",
  true_false: "صح أو خطأ",
};

export const GAME_POINTS_MODE_LABELS: Record<GamePointsMode, string> = {
  standard: "حسب السرعة",
  fixed: "نقاط ثابتة",
  none: "بدون نقاط",
};

export const GAME_STATUS_LABELS: Record<GameTemplateStatus, string> = {
  draft: "مسودة",
  ready: "جاهزة",
};

export const TRUE_FALSE_LABELS = ["صح", "خطأ"] as const;

export type GameOptionDraft = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type GameQuestionDraft = {
  id: string;
  type: GameQuestionType;
  text: string;
  mediaUrl: string | null;
  /** `null` uses `settings.timePerQuestionSec`. */
  timeLimitSec: number | null;
  points: number;
  explanation: string;
  options: GameOptionDraft[];
};

/** Editor state; question / option order is the array order. */
export type GameTemplateDraft = {
  title: string;
  description: string;
  coverImageUrl: string | null;
  settings: GameSettings;
  status: GameTemplateStatus;
  questions: GameQuestionDraft[];
};

export type GameTemplateSummary = {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  status: GameTemplateStatus;
  version: number;
  question_count: number;
  created_by_name: string | null;
  updated_at: string;
};

export type GameTemplateRecord = {
  id: string;
  version: number;
  updated_at: string;
  draft: GameTemplateDraft;
};

function newId() {
  return crypto.randomUUID();
}

export function makeOptions(type: GameQuestionType): GameOptionDraft[] {
  if (type === "true_false") {
    return TRUE_FALSE_LABELS.map((text, index) => ({
      id: newId(),
      text,
      isCorrect: index === 0,
    }));
  }
  return Array.from({ length: 4 }, (_, index) => ({
    id: newId(),
    text: "",
    isCorrect: index === 0,
  }));
}

export function makeQuestion(type: GameQuestionType = "single_choice"): GameQuestionDraft {
  return {
    id: newId(),
    type,
    text: "",
    mediaUrl: null,
    timeLimitSec: null,
    points: DEFAULT_QUESTION_POINTS,
    explanation: "",
    options: makeOptions(type),
  };
}

export function makeTemplateDraft(): GameTemplateDraft {
  return {
    title: "",
    description: "",
    coverImageUrl: null,
    settings: { ...DEFAULT_GAME_SETTINGS },
    status: "draft",
    questions: [makeQuestion()],
  };
}

/** Deep copy with fresh ids (duplicate a question). */
export function cloneQuestion(question: GameQuestionDraft): GameQuestionDraft {
  return {
    ...question,
    id: newId(),
    options: question.options.map((option) => ({ ...option, id: newId() })),
  };
}

export function resolveTimeLimit(
  question: Pick<GameQuestionDraft, "timeLimitSec">,
  settings: Pick<GameSettings, "timePerQuestionSec">,
) {
  return question.timeLimitSec ?? settings.timePerQuestionSec;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const urlField = z
  .string()
  .trim()
  .max(GAME_LIMITS.urlMax)
  .refine(isHttpUrl, "رابط غير صالح")
  .nullable();

const TIME_MESSAGE = `المدة بين ${GAME_LIMITS.timeMinSec} و${GAME_LIMITS.timeMaxSec} ثانية`;
const POINTS_MESSAGE = `النقاط بين 0 و${GAME_LIMITS.pointsMax}`;

const timeField = z
  .number(TIME_MESSAGE)
  .int(TIME_MESSAGE)
  .min(GAME_LIMITS.timeMinSec, TIME_MESSAGE)
  .max(GAME_LIMITS.timeMaxSec, TIME_MESSAGE);

const optionSchema = z.object({
  id: z.uuid(),
  text: z.string().trim().max(GAME_LIMITS.optionTextMax),
  isCorrect: z.boolean(),
});

const questionSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(["single_choice", "true_false"]),
    text: z.string().trim().max(GAME_LIMITS.questionTextMax),
    mediaUrl: urlField,
    timeLimitSec: timeField.nullable(),
    points: z
      .number(POINTS_MESSAGE)
      .int(POINTS_MESSAGE)
      .min(0, POINTS_MESSAGE)
      .max(GAME_LIMITS.pointsMax, POINTS_MESSAGE),
    explanation: z.string().trim().max(GAME_LIMITS.explanationMax),
    options: z.array(optionSchema).max(GAME_LIMITS.optionsMax),
  })
  .refine(
    (question) => question.type !== "true_false" || question.options.length === 2,
    "سؤال صح أو خطأ يحتاج خيارين بالضبط",
  );

/** Structural shape + bounds. Enforced on every save (draft or ready). */
export const gameTemplateDraftSchema = z.object({
  title: z.string().trim().min(1, "العنوان مطلوب").max(GAME_LIMITS.titleMax),
  description: z.string().trim().max(GAME_LIMITS.descriptionMax),
  coverImageUrl: urlField,
  settings: z.object({
    timePerQuestionSec: timeField,
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
    pointsMode: z.enum(["standard", "fixed", "none"]),
  }),
  status: z.enum(["draft", "ready"]),
  questions: z
    .array(questionSchema)
    .max(GAME_LIMITS.questionsMax, `الحد الأقصى ${GAME_LIMITS.questionsMax} سؤال`),
});

export type GameTemplateIssue = {
  /** Index into `questions`, or `null` for template-level issues. */
  questionIndex: number | null;
  message: string;
};

/**
 * Rules a template must pass to be marked `ready` or started. Drafts may be
 * saved incomplete (structure and bounds are still enforced by the schema).
 */
export function collectTemplateIssues(draft: GameTemplateDraft): GameTemplateIssue[] {
  const issues: GameTemplateIssue[] = [];
  if (!draft.title.trim()) {
    issues.push({ questionIndex: null, message: "العنوان مطلوب" });
  }
  if (draft.questions.length === 0) {
    issues.push({ questionIndex: null, message: "أضف سؤالاً واحداً على الأقل" });
  }

  draft.questions.forEach((question, questionIndex) => {
    const push = (message: string) => issues.push({ questionIndex, message });

    if (!question.text.trim()) push("نص السؤال مطلوب");

    const count = question.options.length;
    if (question.type === "true_false" && count !== 2) {
      push("سؤال صح أو خطأ يحتاج خيارين بالضبط");
    }
    if (
      question.type === "single_choice" &&
      (count < GAME_LIMITS.optionsMin || count > GAME_LIMITS.optionsMax)
    ) {
      push("يحتاج السؤال من خيارين إلى أربعة خيارات");
    }
    if (question.options.some((option) => !option.text.trim())) {
      push("لا يمكن ترك خيار فارغاً");
    }
    const correct = question.options.filter((option) => option.isCorrect).length;
    if (correct !== 1) push("حدّد إجابة صحيحة واحدة");

    if (
      question.timeLimitSec !== null &&
      (question.timeLimitSec < GAME_LIMITS.timeMinSec ||
        question.timeLimitSec > GAME_LIMITS.timeMaxSec)
    ) {
      push(
        `مدة السؤال بين ${GAME_LIMITS.timeMinSec} و${GAME_LIMITS.timeMaxSec} ثانية`,
      );
    }
  });

  const time = draft.settings.timePerQuestionSec;
  if (time < GAME_LIMITS.timeMinSec || time > GAME_LIMITS.timeMaxSec) {
    issues.push({
      questionIndex: null,
      message: `المدة الافتراضية بين ${GAME_LIMITS.timeMinSec} و${GAME_LIMITS.timeMaxSec} ثانية`,
    });
  }

  return issues;
}

export type ParsedTemplateDraft =
  | { success: true; draft: GameTemplateDraft }
  | { success: false; error: string };

/** Server-side: parse untrusted input and apply the `ready` rules. */
export function parseTemplateDraft(input: unknown): ParsedTemplateDraft {
  const parsed = gameTemplateDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  const draft: GameTemplateDraft = parsed.data;
  if (draft.status === "ready") {
    const issues = collectTemplateIssues(draft);
    if (issues.length > 0) {
      const first = issues[0];
      const where =
        first.questionIndex === null ? "" : `السؤال ${first.questionIndex + 1}: `;
      return { success: false, error: `${where}${first.message}` };
    }
  }

  return { success: true, draft };
}
