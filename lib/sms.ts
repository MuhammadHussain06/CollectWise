import "server-only";

const TEXTBEE_API = "https://api.textbee.dev/api/v1";

export type SmsResult =
  | { ok: true; providerRef: string | null }
  | { ok: false; error: string };

// Sends one SMS through the textbee gateway phone. A 200 means queued, not delivered.
// Callers log every send in cw_notification_logs.
export async function sendSms(phone: string, text: string): Promise<SmsResult> {
  const apiKey = process.env.TEXTBEE_API_KEY;
  if (!apiKey) return { ok: false, error: "TEXTBEE_API_KEY is not set" };

  const body: Record<string, unknown> = { recipients: [normalizePhone(phone)], message: text };
  // Without a device ID, textbee uses the account's default device.
  if (process.env.TEXTBEE_DEVICE_ID) body.deviceId = process.env.TEXTBEE_DEVICE_ID;

  try {
    const res = await fetch(`${TEXTBEE_API}/gateway/send-sms`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { ok: false, error: `textbee ${res.status}: ${(await res.text()).slice(0, 500)}` };
    }
    const json = (await res.json()) as { data?: { smsBatchId?: string } };
    return { ok: true, providerRef: json.data?.smsBatchId ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Stored phone numbers use +60XXXXXXXXX so SMS replies match residents: "012-345 6789" -> "+60123456789".
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+60${digits.slice(1)}`;
  return `+${digits}`;
}
