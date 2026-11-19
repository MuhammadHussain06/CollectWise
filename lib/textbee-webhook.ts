import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_AGE_SECONDS = 300;

// Payload of textbee's MESSAGE_RECEIVED event (https://textbee.dev/docs/webhooks/events).
export type TextbeeReceived = {
  smsId: string;
  message: string;
  deviceId: string;
  webhookSubscriptionId: string;
  webhookEvent: string;
  idempotencyKey: string;
  sender: string;
  receivedAt: string;
};

// Checks the X-Textbee-Signature header ("t=<unix seconds>,v1=<hex>"):
// HMAC-SHA256 of "<t>.<raw body>" with the webhook's signing secret.
export function verifyTextbeeSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!Number.isFinite(t) || !v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > MAX_AGE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1.toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
