"use client";

import { startGame } from "@/app/actions/games";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Client side of "Start game". One attempt key per start intent:
 * - while a request is pending, further clicks are ignored;
 * - if the request itself is lost (network error), the retry reuses the key,
 *   so the server returns the already-launched game instead of a new one;
 * - after a definite failure, the retry starts a fresh attempt (new key).
 */
export function useStartGame() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const attemptRef = useRef<{ templateId: string; key: string } | null>(null);

  const start = useCallback(async function run(templateId: string) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPendingId(templateId);

    if (attemptRef.current?.templateId !== templateId) {
      attemptRef.current = { templateId, key: crypto.randomUUID() };
    }

    const retry = { label: "إعادة المحاولة", onClick: () => void run(templateId) };

    try {
      const result = await startGame(templateId, attemptRef.current.key);
      if (result.success) {
        attemptRef.current = null;
        toast.success(`تم تشغيل اللعبة — الرمز ${result.pin}`);
        window.location.assign(result.hostUrl);
        return;
      }
      attemptRef.current = null;
      toast.error(result.error, result.retryable ? { action: retry } : undefined);
    } catch {
      toast.error("انقطع الاتصال أثناء تشغيل اللعبة.", { action: retry });
    }

    pendingRef.current = false;
    setPendingId(null);
  }, []);

  return { start, pendingId };
}
