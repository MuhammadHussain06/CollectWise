import "server-only";

export type SmsResult =
  | { ok: true; providerRef: string | null }
  | { ok: false; error: string };

// Sends one SMS through textbee (https://textbee.dev/docs).
// Every send must also be logged in cw_notification_logs by the caller.
export async function sendSms(phone: string, text: string): Promise<SmsResult> {
  // TODO(backend): POST to textbee's send-sms endpoint with TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID.
  void phone;
  void text;
  throw new Error("sendSms not implemented");
}

// Stored phone numbers use the form +60XXXXXXXXX so SMS replies can be matched to residents.
export function normalizePhone(raw: string): string {
  // TODO(backend): strip spaces and dashes; turn a leading 0 into +60.
  return raw;
}
