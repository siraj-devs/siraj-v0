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

export const GAME_QUESTION_TYPES = [
  "single_choice",
  "multi_choice",
  "true_false",
  "slider",
  "puzzle",
] as const satisfies readonly GameQuestionType[];

export const GAME_LIMITS = {
  titleMax: 120,
  descriptionMax: 1000,
  questionTextMax: 300,
  optionTextMax: 120,
  explanationMax: 500,
  urlMax: 2048,
  questionsMax: 100,
  optionsMin: 2,
  optionsMax: 6,
  puzzleItemsMin: 3,
  puzzleItemsMax: 6,
  timeMinSec: 5,
  timeMaxSec: 120,
  pointsMax: 2000,
  sliderAbsMax: 1_000_000_000,
  sliderMaxSteps: 1000,
  sliderUnitMax: 20,
} as const;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timePerQuestionSec: 20,
  shuffleQuestions: false,
  shuffleOptions: false,
  pointsMode: "standard",
};

export const DEFAULT_QUESTION_POINTS = 1000;

export const GAME_QUESTION_TYPE_LABELS: Record<GameQuestionType, string> = {
  single_choice: "إجابة واحدة",
  multi_choice: "عدة إجابات",
  true_false: "صح أو خطأ",
  slider: "شريط تمرير",
  puzzle: "ترتيب",
};

export const GAME_QUESTION_TYPE_HINTS: Record<GameQuestionType, string> = {
  single_choice: "يختار اللاعب إجابة واحدة صحيحة.",
  multi_choice: "يختار اللاعب كل الإجابات الصحيحة.",
  true_false: "يختار اللاعب صح أو خطأ.",
  slider: "يحدد اللاعب رقماً على شريط.",
  puzzle: "يرتّب اللاعب العناصر بالترتيب الصحيح.",
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

/** Questions answered by picking among `options` with `isCorrect` flags. */
export function isChoiceType(type: GameQuestionType) {
  return type === "single_choice" || type === "multi_choice" || type === "true_false";
}

export type GameOptionDraft = {
  id: string;
  text: string;
  /** Choice questions only; ignored for puzzle items. */
  isCorrect: boolean;
};

export type GameSliderConfig = {
  min: number;
  max: number;
  step: number;
  correctValue: number;
  /** ± margin around `correctValue` that still counts as correct. */
  tolerance: number;
  /** Empty string = no unit. */
  unit: string;
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
  /** Choice options, or puzzle items in the correct order. Empty for slider. */
  options: GameOptionDraft[];
  /** Slider questions only. */
  slider: GameSliderConfig | null;
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

export const DEFAULT_SLIDER: GameSliderConfig = {
  min: 0,
  max: 100,
  step: 1,
  correctValue: 50,
  tolerance: 0,
  unit: "",
};

function newId() {
  return crypto.randomUUID();
}

function blankOptions(count: number, firstCorrect: boolean): GameOptionDraft[] {
  return Array.from({ length: count }, (_, index) => ({
    id: newId(),
    text: "",
    isCorrect: firstCorrect && index === 0,
  }));
}

export function makeOptions(type: GameQuestionType): GameOptionDraft[] {
  switch (type) {
    case "true_false":
      return TRUE_FALSE_LABELS.map((text, index) => ({
        id: newId(),
        text,
        isCorrect: index === 0,
      }));
    case "slider":
      return [];
    case "puzzle":
      return blankOptions(4, false);
    default:
      return blankOptions(4, true);
  }
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
    slider: type === "slider" ? { ...DEFAULT_SLIDER } : null,
  };
}

/**
 * Switch a question's type, keeping option texts where they still make sense
 * (between single / multi choice and puzzle).
 */
export function changeQuestionType(
  question: GameQuestionDraft,
  type: GameQuestionType,
): GameQuestionDraft {
  if (type === question.type) return question;
  const base = { ...question, type, slider: null };

  if (type === "true_false" || type === "slider") {
    return {
      ...base,
      options: makeOptions(type),
      slider: type === "slider" ? (question.slider ?? { ...DEFAULT_SLIDER }) : null,
    };
  }

  const reusable =
    question.type === "single_choice" ||
    question.type === "multi_choice" ||
    question.type === "puzzle";
  if (!reusable) return { ...base, options: makeOptions(type) };

  if (type === "puzzle") {
    const options = question.options.map((option) => ({ ...option, isCorrect: false }));
    while (options.length < GAME_LIMITS.puzzleItemsMin) {
      options.push({ id: newId(), text: "", isCorrect: false });
    }
    return { ...base, options };
  }

  const firstCorrect = Math.max(
    0,
    question.options.findIndex((option) => option.isCorrect),
  );
  const options = question.options.map((option, index) => ({
    ...option,
    isCorrect:
      type === "multi_choice" && question.type === "multi_choice"
        ? option.isCorrect
        : index === firstCorrect,
  }));
  return { ...base, options };
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
    slider: question.slider ? { ...question.slider } : null,
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
const SLIDER_NUMBER_MESSAGE = "قيمة الشريط غير صالحة";

const timeField = z
  .number(TIME_MESSAGE)
  .int(TIME_MESSAGE)
  .min(GAME_LIMITS.timeMinSec, TIME_MESSAGE)
  .max(GAME_LIMITS.timeMaxSec, TIME_MESSAGE);

const sliderNumber = z
  .number(SLIDER_NUMBER_MESSAGE)
  .min(-GAME_LIMITS.sliderAbsMax, SLIDER_NUMBER_MESSAGE)
  .max(GAME_LIMITS.sliderAbsMax, SLIDER_NUMBER_MESSAGE);

const sliderSchema = z.object({
  min: sliderNumber,
  max: sliderNumber,
  step: sliderNumber,
  correctValue: sliderNumber,
  tolerance: sliderNumber,
  unit: z.string().trim().max(GAME_LIMITS.sliderUnitMax),
});

const optionSchema = z.object({
  id: z.uuid(),
  text: z.string().trim().max(GAME_LIMITS.optionTextMax),
  isCorrect: z.boolean(),
});

const questionSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(GAME_QUESTION_TYPES),
    text: z.string().trim().max(GAME_LIMITS.questionTextMax),
    mediaUrl: urlField,
    timeLimitSec: timeField.nullable(),
    points: z
      .number(POINTS_MESSAGE)
      .int(POINTS_MESSAGE)
      .min(0, POINTS_MESSAGE)
      .max(GAME_LIMITS.pointsMax, POINTS_MESSAGE),
    explanation: z.string().trim().max(GAME_LIMITS.explanationMax),
    options: z
      .array(optionSchema)
      .max(GAME_LIMITS.optionsMax, `الحد الأقصى ${GAME_LIMITS.optionsMax} خيارات`),
    slider: sliderSchema.nullable(),
  })
  .refine(
    (question) => question.type !== "true_false" || question.options.length === 2,
    "سؤال صح أو خطأ يحتاج خيارين بالضبط",
  )
  .refine(
    (question) => question.type !== "slider" || question.slider !== null,
    "إعدادات الشريط مطلوبة",
  )
  // Normalize: options / slider only where the type uses them.
  .transform((question) => ({
    ...question,
    options: question.type === "slider" ? [] : question.options,
    slider: question.type === "slider" ? question.slider : null,
  }));

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

function isOnStep(value: number, slider: GameSliderConfig) {
  const steps = (value - slider.min) / slider.step;
  return Math.abs(steps - Math.round(steps)) < 1e-6;
}

export function collectSliderIssues(slider: GameSliderConfig | null): string[] {
  if (!slider) return ["إعدادات الشريط مطلوبة"];
  const values = [slider.min, slider.max, slider.step, slider.correctValue, slider.tolerance];
  if (values.some((value) => !Number.isFinite(value))) {
    return ["أكمل كل قيم الشريط"];
  }

  const issues: string[] = [];
  if (slider.min >= slider.max) issues.push("الحد الأدنى يجب أن يكون أصغر من الحد الأعلى");
  if (slider.step <= 0) issues.push("الخطوة يجب أن تكون أكبر من صفر");
  if (issues.length > 0) return issues;

  if ((slider.max - slider.min) / slider.step > GAME_LIMITS.sliderMaxSteps) {
    issues.push(`الشريط لا يتجاوز ${GAME_LIMITS.sliderMaxSteps} خطوة؛ كبّر الخطوة`);
  }
  if (!isOnStep(slider.max, slider)) {
    issues.push("المسافة بين الحدين يجب أن تقبل القسمة على الخطوة");
  }
  if (slider.correctValue < slider.min || slider.correctValue > slider.max) {
    issues.push("الإجابة الصحيحة يجب أن تكون بين الحدين");
  } else if (!isOnStep(slider.correctValue, slider)) {
    issues.push("الإجابة الصحيحة يجب أن تقع على إحدى خطوات الشريط");
  }
  if (slider.tolerance < 0 || slider.tolerance > slider.max - slider.min) {
    issues.push("هامش الخطأ بين صفر والمسافة بين الحدين");
  }
  return issues;
}

function collectQuestionIssues(question: GameQuestionDraft): string[] {
  const issues: string[] = [];
  if (!question.text.trim()) issues.push("نص السؤال مطلوب");

  if (
    question.timeLimitSec !== null &&
    (question.timeLimitSec < GAME_LIMITS.timeMinSec ||
      question.timeLimitSec > GAME_LIMITS.timeMaxSec)
  ) {
    issues.push(TIME_MESSAGE);
  }

  if (question.type === "slider") {
    return [...issues, ...collectSliderIssues(question.slider)];
  }

  const count = question.options.length;
  const emptyText = question.options.some((option) => !option.text.trim());

  if (question.type === "puzzle") {
    if (count < GAME_LIMITS.puzzleItemsMin || count > GAME_LIMITS.puzzleItemsMax) {
      issues.push(
        `الترتيب يحتاج من ${GAME_LIMITS.puzzleItemsMin} إلى ${GAME_LIMITS.puzzleItemsMax} عناصر`,
      );
    }
    if (emptyText) issues.push("لا يمكن ترك عنصر فارغاً");
    const texts = question.options.map((option) => option.text.trim());
    if (!emptyText && new Set(texts).size !== texts.length) {
      issues.push("العناصر يجب أن تكون مختلفة");
    }
    return issues;
  }

  if (question.type === "true_false" && count !== 2) {
    issues.push("سؤال صح أو خطأ يحتاج خيارين بالضبط");
  } else if (count < GAME_LIMITS.optionsMin || count > GAME_LIMITS.optionsMax) {
    issues.push(
      `يحتاج السؤال من ${GAME_LIMITS.optionsMin} إلى ${GAME_LIMITS.optionsMax} خيارات`,
    );
  }
  if (emptyText) issues.push("لا يمكن ترك خيار فارغاً");

  const correct = question.options.filter((option) => option.isCorrect).length;
  if (question.type === "multi_choice") {
    if (correct === 0) issues.push("حدّد إجابة صحيحة واحدة على الأقل");
  } else if (correct !== 1) {
    issues.push("حدّد إجابة صحيحة واحدة");
  }
  return issues;
}

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
    for (const message of collectQuestionIssues(question)) {
      issues.push({ questionIndex, message });
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
