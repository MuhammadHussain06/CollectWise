import { beforeEach, describe, expect, it, vi } from "vitest";
import { receivedEvent, signTextbee } from "../helpers/textbee";

type QueryResult = { data: unknown; error: { message: string } | null };

// In-memory stand-in for the Supabase client: records filters and upserts per table.
const fake = vi.hoisted(() => ({
  results: {} as Record<string, QueryResult>,
  filters: {} as Record<string, [string, unknown][]>,
  upserts: [] as { table: string; row: Record<string, unknown>; options: unknown }[],
  upsertError: null as { message: string } | null,
}));

vi.mock("@/lib/db", () => ({
  db: {
    from(table: string) {
      fake.filters[table] = [];
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => {
          fake.filters[table].push([column, value]);
          return builder;
        },
        order: () => builder,
        limit: () => builder,
        maybeSingle: async () => fake.results[table] ?? { data: null, error: null },
        upsert: async (row: Record<string, unknown>, options: unknown) => {
          fake.upserts.push({ table, row, options });
          return { error: fake.upsertError };
        },
      };
      return builder;
    },
  },
}));

const { POST } = await import("@/app/api/sms/incoming/route");

const SECRET = "integration-secret-of-20-chars";

function signedRequest(event: object, secret = SECRET) {
  const body = JSON.stringify(event);
  return new Request("http://localhost/api/sms/incoming", {
    method: "POST",
    headers: { "content-type": "application/json", "x-textbee-signature": signTextbee(body, secret) },
    body,
  });
}

describe("POST /api/sms/incoming", () => {
  beforeEach(() => {
    vi.stubEnv("TEXTBEE_WEBHOOK_SECRET", SECRET);
    vi.useFakeTimers({ now: new Date("2026-12-07T09:30:00Z"), toFake: ["Date"] });
    fake.results = {};
    fake.filters = {};
    fake.upserts = [];
    fake.upsertError = null;
  });

  it("returns 503 when the webhook secret is not configured", async () => {
    vi.stubEnv("TEXTBEE_WEBHOOK_SECRET", "");
    expect((await POST(signedRequest(receivedEvent()))).status).toBe(503);
  });

  it("returns 401 for an unsigned request", async () => {
    const res = await POST(new Request("http://localhost/api/sms/incoming", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
    expect(fake.upserts).toHaveLength(0);
  });

  it("returns 401 when signed with another secret", async () => {
    expect((await POST(signedRequest(receivedEvent(), "wrong-secret-of-20-chars!!"))).status).toBe(401);
  });

  it("returns 400 for a signed body that is not JSON", async () => {
    const body = "not json";
    const req = new Request("http://localhost/api/sms/incoming", {
      method: "POST",
      headers: { "x-textbee-signature": signTextbee(body, SECRET) },
      body,
    });
    expect((await POST(req)).status).toBe(400);
  });

  it("ignores events other than MESSAGE_RECEIVED", async () => {
    const res = await POST(signedRequest(receivedEvent({ webhookEvent: "MESSAGE_DELIVERED" })));
    expect(await res.json()).toEqual({ ignored: "event" });
    expect(fake.upserts).toHaveLength(0);
  });

  it("ignores senders who are not registered residents", async () => {
    const res = await POST(signedRequest(receivedEvent({ sender: "0199999999" })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ignored: "unknown sender" });
    expect(fake.filters.cw_users).toContainEqual(["phone_number", "+60199999999"]);
    expect(fake.upserts).toHaveLength(0);
  });

  it("creates a report for today's schedule on the resident's floor", async () => {
    fake.results.cw_users = { data: { user_id: 46, floor_id: 22 }, error: null };
    fake.results.cw_collection_schedules = { data: { schedule_id: 7 }, error: null };

    const res = await POST(signedRequest(receivedEvent({ sender: "012-345 6777", message: "Not collected" })));

    expect(res.status).toBe(200);
    expect(fake.filters.cw_users).toContainEqual(["phone_number", "+60123456777"]);
    expect(fake.filters.cw_collection_schedules).toEqual([
      ["floor_id", 22],
      ["collection_date", "2026-12-07"],
    ]);
    expect(fake.upserts).toEqual([
      {
        table: "cw_missed_reports",
        row: {
          resident_id: 46,
          floor_id: 22,
          schedule_id: 7,
          description: "Not collected",
          reported_at: "2026-12-07T09:30:00.000Z",
          sms_id: "sms-1",
        },
        options: { onConflict: "sms_id", ignoreDuplicates: true },
      },
    ]);
  });

  it("creates a report without a schedule when none exists today", async () => {
    fake.results.cw_users = { data: { user_id: 46, floor_id: 22 }, error: null };

    await POST(signedRequest(receivedEvent()));

    expect(fake.upserts[0].row.schedule_id).toBeNull();
  });

  it("returns 500 when the report cannot be saved", async () => {
    fake.results.cw_users = { data: { user_id: 46, floor_id: 22 }, error: null };
    fake.upsertError = { message: "insert failed" };

    const res = await POST(signedRequest(receivedEvent()));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "insert failed" });
  });
});
