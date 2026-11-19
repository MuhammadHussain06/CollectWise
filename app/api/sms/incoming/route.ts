// textbee webhook for received SMS. A reply from a registered resident becomes a missed-collection report.
export async function POST(request: Request) {
  // TODO(backend):
  // 1. Reject requests without the correct SMS_WEBHOOK_SECRET.
  // 2. Read the sender number and message text from textbee's payload
  //    (https://textbee.dev/docs/webhooks/events); skip retries with a seen idempotencyKey.
  // 3. Match the sender to cw_users.phone_number (normalizePhone); ignore unknown numbers.
  // 4. Insert into cw_missed_reports with the resident's floor_id, today's schedule_id
  //    for that floor if any, and the message text as description.
  void request;
  return Response.json({ error: "not implemented" }, { status: 501 });
}
