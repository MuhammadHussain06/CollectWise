import { createHmac } from "node:crypto";

// Builds an X-Textbee-Signature header the way textbee signs webhooks.
export function signTextbee(body: string, secret: string, unixSeconds = Math.floor(Date.now() / 1000)): string {
  const v1 = createHmac("sha256", secret).update(`${unixSeconds}.${body}`).digest("hex");
  return `t=${unixSeconds},v1=${v1}`;
}

export function receivedEvent(overrides: Record<string, unknown> = {}) {
  return {
    smsId: "sms-1",
    message: "MISSED",
    deviceId: "device-1",
    webhookSubscriptionId: "sub-1",
    webhookEvent: "MESSAGE_RECEIVED",
    idempotencyKey: "idem-1",
    sender: "+60123456777",
    receivedAt: "2026-12-07T09:30:00.000Z",
    ...overrides,
  };
}
