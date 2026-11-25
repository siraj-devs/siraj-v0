import env from "@/env";
import { mockPlayStore } from "@/lib/play-app/mock-store";
import { NextResponse } from "next/server";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** DEV ONLY: stand-in for the play app's host screen (`hostUrl`). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  if (env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const { gameId } = await params;
  const game = mockPlayStore().byGameId.get(gameId);
  if (!game) {
    return new NextResponse("Unknown mock game (dev server restarted?)", {
      status: 404,
    });
  }

  const { snapshot, response } = game;
  const questions = snapshot.questions
    .map(
      (question) =>
        `<li>${escapeHtml(question.text)} <small>(${question.timeLimitSec}s, ${question.points} pts)</small></li>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mock host</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem;">
  <p style="color:#b45309">Mock play app (development only)</p>
  <h1>${escapeHtml(snapshot.title)}</h1>
  <p>PIN: <strong style="font-size:2rem; letter-spacing:.2em">${escapeHtml(response.pin)}</strong></p>
  <p>Host: ${escapeHtml(snapshot.host.displayName)} · template v${snapshot.source.templateVersion} · session ${escapeHtml(snapshot.source.sessionId)}</p>
  <ol>${questions}</ol>
  <details><summary>Snapshot JSON</summary><pre dir="ltr" style="white-space:pre-wrap">${escapeHtml(JSON.stringify(snapshot, null, 2))}</pre></details>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
