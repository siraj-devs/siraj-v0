"use server";

import env from "@/env";
import { requireGamesPermission } from "@/lib/auth-guards";
import { GAMES_PATH } from "@/lib/games-access";
import {
  cloneQuestion,
  collectTemplateIssues,
  DEFAULT_GAME_SETTINGS,
  GAME_LIMITS,
  parseTemplateDraft,
  resolveTimeLimit,
  type GameQuestionDraft,
  type GameSettings,
  type GameTemplateDraft,
  type GameTemplateRecord,
  type GameTemplateStatus,
  type GameTemplateSummary,
} from "@/lib/games";
import { createPlayGame, PlayAppError } from "@/lib/play-app/client";
import { createClient } from "@/lib/supabase/server";
import type { GameSnapshot } from "@/types/game-snapshot";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type Result<T extends object = object> =
  | ({ success: true } & T)
  | { success: false; error: string };

const UNAUTHORIZED = "غير مصرح";
const IMAGE_BUCKET = "games";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const TEMPLATE_SELECT =
  "id, title, description, cover_image_url, default_settings, version, status, updated_at, game_questions(id, position, type, text, media_url, time_limit_sec, points, explanation, game_question_options(id, position, text, is_correct))";

const uuidSchema = z.uuid();

function revalidateGames(templateId?: string) {
  revalidatePath(GAMES_PATH);
  if (templateId) revalidatePath(`${GAMES_PATH}/${templateId}`);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message === UNAUTHORIZED
    ? UNAUTHORIZED
    : fallback;
}

function normalizeSettings(raw: unknown): GameSettings {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<GameSettings>;
  return {
    timePerQuestionSec:
      typeof value.timePerQuestionSec === "number"
        ? value.timePerQuestionSec
        : DEFAULT_GAME_SETTINGS.timePerQuestionSec,
    shuffleQuestions: value.shuffleQuestions === true,
    shuffleOptions: value.shuffleOptions === true,
    pointsMode:
      value.pointsMode === "fixed" || value.pointsMode === "none"
        ? value.pointsMode
        : "standard",
  };
}

type OptionRow = { id: string; position: number; text: string; is_correct: boolean };
type QuestionRow = {
  id: string;
  position: number;
  type: GameQuestionDraft["type"];
  text: string;
  media_url: string | null;
  time_limit_sec: number | null;
  points: number;
  explanation: string | null;
  game_question_options: OptionRow[] | null;
};
type TemplateRow = {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  default_settings: unknown;
  version: number;
  status: GameTemplateStatus;
  updated_at: string;
  game_questions: QuestionRow[] | null;
};

function mapTemplateRow(row: TemplateRow): GameTemplateRecord {
  const questions = [...(row.game_questions ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(
      (question): GameQuestionDraft => ({
        id: question.id,
        type: question.type,
        text: question.text,
        mediaUrl: question.media_url,
        timeLimitSec: question.time_limit_sec,
        points: question.points,
        explanation: question.explanation ?? "",
        options: [...(question.game_question_options ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((option) => ({
            id: option.id,
            text: option.text,
            isCorrect: option.is_correct,
          })),
      }),
    );

  return {
    id: row.id,
    version: row.version,
    updated_at: row.updated_at,
    draft: {
      title: row.title,
      description: row.description,
      coverImageUrl: row.cover_image_url,
      settings: normalizeSettings(row.default_settings),
      status: row.status,
      questions,
    },
  };
}

async function loadTemplate(id: string): Promise<GameTemplateRecord | null> {
  if (!uuidSchema.safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_templates")
    .select(TEMPLATE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching game template:", error);
    return null;
  }
  return data ? mapTemplateRow(data as unknown as TemplateRow) : null;
}

/** Only images uploaded through `uploadGameImage` (our storage bucket). */
function isOwnImageUrl(url: string | null) {
  if (url === null) return true;
  const prefix = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/${IMAGE_BUCKET}/`;
  return url.startsWith(prefix);
}

function toRpcQuestions(questions: GameQuestionDraft[]) {
  return questions.map((question, index) => ({
    id: question.id,
    position: index + 1,
    type: question.type,
    text: question.text,
    media_url: question.mediaUrl,
    time_limit_sec: question.timeLimitSec,
    points: question.points,
    explanation: question.explanation,
    options: question.options.map((option, optionIndex) => ({
      id: option.id,
      position: optionIndex + 1,
      text: option.text,
      is_correct: option.isCorrect,
    })),
  }));
}

async function saveViaRpc({
  templateId,
  expectedVersion,
  createdBy,
  draft,
}: {
  templateId: string | null;
  expectedVersion: number | null;
  createdBy: number;
  draft: GameTemplateDraft;
}): Promise<Result<{ id: string; version: number }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_game_template", {
    p_template_id: templateId,
    p_expected_version: expectedVersion,
    p_created_by: createdBy,
    p_template: {
      title: draft.title,
      description: draft.description,
      cover_image_url: draft.coverImageUrl,
      default_settings: draft.settings,
      status: draft.status,
    },
    p_questions: toRpcQuestions(draft.questions),
  });

  if (error) {
    if (error.message.includes("game_template_version_conflict")) {
      return {
        success: false,
        error: "تم تعديل القالب من مكان آخر. أعد تحميل الصفحة ثم حاول مجدداً.",
      };
    }
    if (error.message.includes("game_template_not_found")) {
      return { success: false, error: "القالب غير موجود" };
    }
    console.error("Error saving game template:", error);
    return { success: false, error: "تعذر حفظ القالب" };
  }

  const saved = data as { id: string; version: number };
  return { success: true, id: saved.id, version: saved.version };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listGameTemplates(): Promise<GameTemplateSummary[]> {
  await requireGamesPermission("games.view");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_templates")
    .select(
      "id, title, description, cover_image_url, status, version, updated_at, members(name), game_questions(count)",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching game templates:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const creator = Array.isArray(row.members) ? row.members[0] : row.members;
    const counts = row.game_questions as unknown as { count: number }[] | null;
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      cover_image_url: (row.cover_image_url as string | null) ?? null,
      status: row.status as GameTemplateStatus,
      version: row.version as number,
      question_count: counts?.[0]?.count ?? 0,
      created_by_name: (creator as { name?: string } | null)?.name ?? null,
      updated_at: row.updated_at as string,
    };
  });
}

export async function getGameTemplate(
  id: string,
): Promise<GameTemplateRecord | null> {
  await requireGamesPermission("games.view");
  return loadTemplate(id);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveGameTemplate(input: {
  id: string | null;
  expectedVersion: number | null;
  draft: unknown;
}): Promise<Result<{ id: string; version: number }>> {
  try {
    const { member } = await requireGamesPermission("games.manage");

    if (input.id !== null && !uuidSchema.safeParse(input.id).success) {
      return { success: false, error: "القالب غير موجود" };
    }
    const expectedVersion =
      input.id !== null &&
      Number.isInteger(input.expectedVersion) &&
      (input.expectedVersion ?? 0) >= 1
        ? input.expectedVersion
        : null;

    const parsed = parseTemplateDraft(input.draft);
    if (!parsed.success) return parsed;

    const { draft } = parsed;
    if (
      !isOwnImageUrl(draft.coverImageUrl) ||
      draft.questions.some((question) => !isOwnImageUrl(question.mediaUrl))
    ) {
      return { success: false, error: "الصور يجب أن تُرفع من المحرر" };
    }

    const result = await saveViaRpc({
      templateId: input.id,
      expectedVersion,
      createdBy: member.id,
      draft,
    });
    if (result.success) revalidateGames(result.id);
    return result;
  } catch (error) {
    return { success: false, error: errorMessage(error, "تعذر حفظ القالب") };
  }
}

export async function deleteGameTemplate(id: string): Promise<Result> {
  try {
    await requireGamesPermission("games.manage");
    if (!uuidSchema.safeParse(id).success) {
      return { success: false, error: "القالب غير موجود" };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("game_templates").delete().eq("id", id);
    if (error) {
      console.error("Error deleting game template:", error);
      return { success: false, error: "تعذر حذف القالب" };
    }

    revalidateGames(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, "تعذر حذف القالب") };
  }
}

export async function duplicateGameTemplate(
  id: string,
): Promise<Result<{ id: string }>> {
  try {
    const { member } = await requireGamesPermission("games.manage");
    const source = await loadTemplate(id);
    if (!source) return { success: false, error: "القالب غير موجود" };

    const suffix = " (نسخة)";
    const result = await saveViaRpc({
      templateId: null,
      expectedVersion: null,
      createdBy: member.id,
      draft: {
        ...source.draft,
        title: `${source.draft.title.slice(0, GAME_LIMITS.titleMax - suffix.length)}${suffix}`,
        status: "draft",
        questions: source.draft.questions.map(cloneQuestion),
      },
    });
    if (!result.success) return result;

    revalidateGames();
    return { success: true, id: result.id };
  } catch (error) {
    return { success: false, error: errorMessage(error, "تعذر نسخ القالب") };
  }
}

export async function uploadGameImage(
  formData: FormData,
): Promise<Result<{ url: string }>> {
  try {
    await requireGamesPermission("games.manage");

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "اختر صورة" };
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      return { success: false, error: "نوع الصورة غير مدعوم" };
    }
    if (file.size > IMAGE_MAX_BYTES) {
      return { success: false, error: "حجم الصورة أكبر من 5 ميغابايت" };
    }

    const ext = file.type.split("/")[1] ?? "bin";
    const path = `images/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading game image:", error);
      return { success: false, error: "تعذر رفع الصورة" };
    }

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return { success: true, url: data.publicUrl };
  } catch (error) {
    return { success: false, error: errorMessage(error, "تعذر رفع الصورة") };
  }
}

// ---------------------------------------------------------------------------
// Start game
// ---------------------------------------------------------------------------

export type StartGameResult =
  | { success: true; hostUrl: string; pin: string }
  | { success: false; error: string; retryable: boolean };

function buildSnapshot({
  sessionId,
  template,
  host,
}: {
  sessionId: string;
  template: GameTemplateRecord;
  host: { id: number; name: string };
}): GameSnapshot {
  const { draft } = template;
  return {
    source: {
      app: "base",
      sessionId,
      templateId: template.id,
      templateVersion: template.version,
    },
    host: { hostId: String(host.id), displayName: host.name },
    settings: { ...draft.settings },
    title: draft.title,
    questions: draft.questions.map((question, index) => ({
      id: question.id,
      position: index + 1,
      type: question.type,
      text: question.text,
      mediaUrl: question.mediaUrl,
      timeLimitSec: resolveTimeLimit(question, draft.settings),
      points: question.points,
      explanation: question.explanation.trim() || null,
      options: question.options.map((option, optionIndex) => ({
        id: option.id,
        position: optionIndex + 1,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    })),
  };
}

function launchErrorMessage(error: unknown) {
  if (error instanceof PlayAppError) {
    if (error.kind === "config") return "خدمة الألعاب غير مهيأة بعد.";
    if (error.kind === "timeout") return "تأخرت خدمة الألعاب في الرد.";
  }
  return "تعذر الاتصال بخدمة الألعاب.";
}

/**
 * Launch a game on the play app.
 *
 * `attemptKey` (uuid) is generated by the client once per "Start" intent and
 * becomes the session's `idempotency_key`. Re-sending the same key (double
 * click, lost response) returns the existing session instead of creating a
 * second game. After a definite failure the client starts a new attempt with
 * a new key, since the template may have changed in between.
 */
export async function startGame(
  templateId: string,
  attemptKey: string,
): Promise<StartGameResult> {
  let member: { id: number; name: string };
  try {
    ({ member } = await requireGamesPermission("games.manage"));
  } catch {
    return { success: false, error: UNAUTHORIZED, retryable: false };
  }

  if (!uuidSchema.safeParse(attemptKey).success) {
    return { success: false, error: "طلب غير صالح", retryable: false };
  }

  const template = await loadTemplate(templateId);
  if (!template) {
    return { success: false, error: "القالب غير موجود", retryable: false };
  }
  if (template.draft.status !== "ready") {
    return {
      success: false,
      error: "اجعل حالة القالب «جاهزة» قبل بدء اللعبة.",
      retryable: false,
    };
  }
  const issues = collectTemplateIssues(template.draft);
  if (issues.length > 0) {
    return {
      success: false,
      error: "القالب غير مكتمل. افتحه وصحّح الأخطاء.",
      retryable: false,
    };
  }

  const supabase = await createClient();
  const { data: inserted, error: insertError } = await supabase
    .from("game_sessions")
    .insert({
      template_id: template.id,
      template_version: template.version,
      host_id: member.id,
      idempotency_key: attemptKey,
      status: "launching",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code !== "23505") {
      console.error("Error creating game session:", insertError);
      return { success: false, error: "تعذر بدء اللعبة", retryable: true };
    }

    const { data: existing } = await supabase
      .from("game_sessions")
      .select("template_id, host_id, status, host_url, pin")
      .eq("idempotency_key", attemptKey)
      .maybeSingle();

    if (
      !existing ||
      existing.host_id !== member.id ||
      existing.template_id !== template.id
    ) {
      return { success: false, error: "طلب غير صالح", retryable: false };
    }
    if (existing.status === "launched" && existing.host_url && existing.pin) {
      return { success: true, hostUrl: existing.host_url, pin: existing.pin };
    }
    if (existing.status === "launching") {
      return {
        success: false,
        error: "جاري تشغيل اللعبة بالفعل، انتظر لحظة.",
        retryable: false,
      };
    }
    return { success: false, error: "تعذر بدء اللعبة", retryable: true };
  }

  const sessionId = inserted.id as string;
  const snapshot = buildSnapshot({ sessionId, template, host: member });

  try {
    const game = await createPlayGame(snapshot, attemptKey);
    const { error: updateError } = await supabase
      .from("game_sessions")
      .update({
        status: "launched",
        play_game_id: game.gameId,
        pin: game.pin,
        host_url: game.hostUrl,
      })
      .eq("id", sessionId);
    if (updateError) {
      console.error("Error saving launched game session:", updateError);
    }
    return { success: true, hostUrl: game.hostUrl, pin: game.pin };
  } catch (error) {
    console.error("Error launching game:", error);
    await supabase
      .from("game_sessions")
      .update({
        status: "failed",
        error_message: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
      })
      .eq("id", sessionId);
    return { success: false, error: launchErrorMessage(error), retryable: true };
  }
}
