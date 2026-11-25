import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * HMAC-SHA256 request signing shared with the play app.
 * Signature = hex(HMAC_SHA256(secret, `${timestamp}.${rawBody}`)), where
 * `timestamp` is unix milliseconds sent as `X-Timestamp`.
 */

/** Requests older/newer than this are rejected (replay window). */
export const SIGNATURE_MAX_SKEW_MS = 5 * 60 * 1000;

export function signPlayAppRequest(
  secret: string,
  timestamp: string,
  rawBody: string,
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

export function verifyPlayAppSignature({
  secret,
  timestamp,
  rawBody,
  signature,
  now = Date.now(),
}: {
  secret: string;
  timestamp: string | null;
  rawBody: string;
  signature: string | null;
  now?: number;
}): boolean {
  if (!timestamp || !/^\d{1,16}$/.test(timestamp)) return false;
  if (Math.abs(now - Number(timestamp)) > SIGNATURE_MAX_SKEW_MS) return false;
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;

  const expected = Buffer.from(
    signPlayAppRequest(secret, timestamp, rawBody),
    "hex",
  );
  const received = Buffer.from(signature, "hex");
  return timingSafeEqual(expected, received);
}
