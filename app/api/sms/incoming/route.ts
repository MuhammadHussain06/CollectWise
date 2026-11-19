import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/sms";
import { todayInMalaysia } from "@/lib/time";
import { verifyTextbeeSignature, type TextbeeReceived } from "@/lib/textbee-webhook";

// textbee webhook: a reply from a registered resident becomes a missed-collection report.
// Non-error responses are 200 so textbee does not retry messages that are deliberately ignored.
export async function POST(request: Request) {
  const secret = process.env.TEXTBEE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "webhook not configured" }, { status: 503 });

  const rawBody = await request.text();
  if (!verifyTextbeeSignature(rawBody, request.headers.get("x-textbee-signature"), secret)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: TextbeeReceived;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (event.webhookEvent !== "MESSAGE_RECEIVED") return Response.json({ ignored: "event" });

  const { data: resident, error: userError } = await db
    .from("cw_users")
    .select("user_id, floor_id")
    .eq("phone_number", normalizePhone(event.sender ?? ""))
    .eq("account_status", "ACTIVE")
    .maybeSingle();
  if (userError) return Response.json({ error: userError.message }, { status: 500 });
  if (!resident) return Response.json({ ignored: "unknown sender" });

  let scheduleId: number | null = null;
  if (resident.floor_id) {
    const { data: schedule } = await db
      .from("cw_collection_schedules")
      .select("schedule_id")
      .eq("floor_id", resident.floor_id)
      .eq("collection_date", todayInMalaysia())
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();
    scheduleId = schedule?.schedule_id ?? null;
  }

  // sms_id is unique, so a retried delivery of the same SMS is skipped.
  const { error: insertError } = await db.from("cw_missed_reports").upsert(
    {
      resident_id: resident.user_id,
      floor_id: resident.floor_id,
      schedule_id: scheduleId,
      description: event.message,
      reported_at: event.receivedAt,
      sms_id: event.smsId,
    },
    { onConflict: "sms_id", ignoreDuplicates: true },
  );
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  return Response.json({ ok: true });
}
