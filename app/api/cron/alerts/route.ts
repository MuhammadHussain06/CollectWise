// Called every 10 minutes by an external scheduler with `Authorization: Bearer CRON_SECRET`.
// Texts residents of each floor whose round starts within ALERT_LEAD_MINUTES.
export async function GET(request: Request) {
  // TODO(backend):
  // 1. Reject requests without the correct CRON_SECRET.
  // 2. Find today's SCHEDULED rows in cw_collection_schedules starting within the lead time
  //    that have no COLLECTION_REMINDER in cw_notification_logs yet.
  // 3. For each active resident on that floor: insert a QUEUED log, call sendSms,
  //    then update the log to SENT or FAILED with provider_ref / error_message.
  void request;
  return Response.json({ error: "not implemented" }, { status: 501 });
}
