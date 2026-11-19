import { readFileSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Runs supabase/schema.sql, seed.sql and data.sql against a real Postgres.
// Requires DATABASE_URL pointing at a throwaway database: the public schema is recreated.
const DATABASE_URL = process.env.DATABASE_URL;
const sql = (file: string) => readFileSync(new URL(`../../supabase/${file}`, import.meta.url), "utf8");
const TODAY = "(now() at time zone 'Asia/Kuala_Lumpur')::date";

describe.skipIf(!DATABASE_URL)("database schema", () => {
  const client = new Client({ connectionString: DATABASE_URL });

  beforeAll(async () => {
    await client.connect();
    await client.query(`
      drop schema if exists public cascade;
      create schema public;
      do $$ begin
        if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select from pg_roles where rolname = 'service_role') then create role service_role bypassrls; end if;
      end $$;
      grant usage on schema public to anon, authenticated;
    `);
    await client.query(sql("schema.sql"));
    await client.query(sql("seed.sql"));
    await client.query(sql("data.sql"));
  });

  afterAll(async () => {
    await client.end();
  });

  const one = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    (await client.query(text, params)).rows[0] as T;

  async function newSchedule(floorId = 21, status = "SCHEDULED") {
    return (
      await one<{ schedule_id: number }>(
        `insert into cw_collection_schedules (floor_id, collection_date, start_time, schedule_status)
         values ($1, ${TODAY}, now(), $2) returning schedule_id`,
        [floorId, status],
      )
    ).schedule_id;
  }

  describe("imported APEX data", () => {
    it("has the APEX roles with their original IDs and names", async () => {
      const { rows } = await client.query("select role_id, role_code, role_name from cw_roles order by role_id");
      expect(rows).toEqual([
        { role_id: 1, role_code: "RESIDENT", role_name: "Resident" },
        { role_id: 2, role_code: "COLLECTOR", role_name: "Waste Collector" },
        { role_id: 3, role_code: "MANAGEMENT", role_name: "Management / JMB" },
        { role_id: 4, role_code: "ADMIN", role_name: "System Administrator" },
      ]);
    });

    it("has the 6 floors, with floor 6 inactive", async () => {
      expect(await one("select count(*)::int as n from cw_floors")).toEqual({ n: 6 });
      expect(await one("select is_active from cw_floors where floor_id = 23")).toEqual({ is_active: false });
    });

    it("has the 6 users and 3 reports", async () => {
      expect(await one("select count(*)::int as n from cw_users")).toEqual({ n: 6 });
      expect(await one("select count(*)::int as n from cw_missed_reports")).toEqual({ n: 3 });
    });

    it("maps the APEX ASSIGNED status to IN_PROGRESS", async () => {
      expect(await one("select report_status from cw_missed_reports where report_id = 3")).toEqual({
        report_status: "IN_PROGRESS",
      });
    });

    it("continues IDs after the imported rows", async () => {
      const floor = await one<{ floor_id: number }>(
        "insert into cw_floors (floor_number, floor_label) values (7, 'Floor 7') returning floor_id",
      );
      const user = await one<{ user_id: number; role_id: number }>(
        "insert into cw_users (full_name) values ('New Resident') returning user_id, role_id",
      );
      expect(floor.floor_id).toBeGreaterThan(23);
      expect(user.user_id).toBeGreaterThan(82);
      expect(user.role_id).toBe(1);
    });
  });

  describe("constraints", () => {
    it.each([
      ["a duplicate floor in the same block", "insert into cw_floors (floor_number, floor_label) values (1, 'dup')"],
      ["an unknown role code", "insert into cw_roles (role_code, role_name) values ('GUEST', 'Guest')"],
      ["a duplicate phone number", "insert into cw_users (full_name, phone_number) values ('x', '+60123456789')"],
      ["an unknown report status", "insert into cw_missed_reports (resident_id, report_status) values (46, 'DONE')"],
      ["an unknown report category", "insert into cw_missed_reports (resident_id, report_category) values (46, 'Noise')"],
      [
        "an end time before the start time",
        "insert into cw_collection_schedules (floor_id, collection_date, start_time, end_time) values (21, current_date, now(), now() - interval '1 hour')",
      ],
    ])("rejects %s", async (_, statement) => {
      await expect(client.query(statement)).rejects.toThrow();
    });

    it("rejects a second report from the same SMS", async () => {
      await client.query("insert into cw_missed_reports (resident_id, sms_id) values (46, 'sms-dup')");
      await expect(
        client.query("insert into cw_missed_reports (resident_id, sms_id) values (46, 'sms-dup')"),
      ).rejects.toThrow(/unique/);
    });
  });

  describe("cw_collector_checkin", () => {
    it("logs the check-in and completes the schedule", async () => {
      const scheduleId = await newSchedule();

      const { log_id } = await one<{ log_id: number }>("select cw_collector_checkin($1, 43, 'ok') as log_id", [
        scheduleId,
      ]);

      expect(log_id).toBeGreaterThan(0);
      expect(await one("select schedule_status from cw_collection_schedules where schedule_id = $1", [scheduleId]))
        .toEqual({ schedule_status: "COMPLETED" });
      expect(await one("select collector_id, collection_status from cw_collection_logs where log_id = $1", [log_id]))
        .toEqual({ collector_id: 43, collection_status: "COMPLETED" });
    });

    it("refuses a second check-in for the same schedule", async () => {
      const scheduleId = await newSchedule();
      await client.query("select cw_collector_checkin($1, 43)", [scheduleId]);

      await expect(client.query("select cw_collector_checkin($1, 43)", [scheduleId])).rejects.toThrow(
        "This schedule is not open for check-in.",
      );
    });

    it("refuses users who are not collectors", async () => {
      const scheduleId = await newSchedule();
      await expect(client.query("select cw_collector_checkin($1, 46)", [scheduleId])).rejects.toThrow(
        "Only active collectors can check in.",
      );
    });

    it("refuses cancelled schedules", async () => {
      const scheduleId = await newSchedule(21, "CANCELLED");
      await expect(client.query("select cw_collector_checkin($1, 43)", [scheduleId])).rejects.toThrow(
        "This schedule is not open for check-in.",
      );
    });
  });

  describe("cw_update_report_status", () => {
    it("records the resolution time when resolved", async () => {
      await client.query("select cw_update_report_status(2, 'RESOLVED', 45, 'Bin replaced')");
      const row = await one<{ report_status: string; resolved_at: Date | null; assigned_to: number }>(
        "select report_status, resolved_at, assigned_to from cw_missed_reports where report_id = 2",
      );
      expect(row.report_status).toBe("RESOLVED");
      expect(row.resolved_at).toBeInstanceOf(Date);
      expect(row.assigned_to).toBe(45);
    });

    it("clears the resolution time when reopened", async () => {
      await client.query("select cw_update_report_status(2, 'IN_PROGRESS', 45)");
      expect(await one("select resolved_at from cw_missed_reports where report_id = 2")).toEqual({ resolved_at: null });
    });

    it("rejects an unknown report", async () => {
      await expect(client.query("select cw_update_report_status(9999, 'RESOLVED', 45)")).rejects.toThrow(
        "Report not found.",
      );
    });
  });

  describe("dashboard views", () => {
    it("shows each of today's schedules with its progress", async () => {
      const pending = await newSchedule(22);
      const done = await newSchedule(1);
      await client.query("select cw_collector_checkin($1, 43)", [done]);

      const { rows } = await client.query(
        "select schedule_id, progress_status from cw_v_floor_progress where schedule_id = any($1) order by schedule_id",
        [[pending, done]],
      );
      expect(rows).toEqual([
        { schedule_id: pending, progress_status: "PENDING" },
        { schedule_id: done, progress_status: "COMPLETED" },
      ]);
    });

    it("counts today's schedules, completions and open reports", async () => {
      const summary = await one<Record<string, string>>("select * from cw_v_dashboard_summary");
      const expected = await one<Record<string, string>>(`
        select
          (select count(*) from cw_collection_schedules
            where collection_date = ${TODAY} and schedule_status <> 'CANCELLED') as scheduled_today,
          (select count(*) from cw_collection_logs) as completed_today,
          (select count(*) from cw_missed_reports where report_status in ('PENDING', 'IN_PROGRESS')) as open_reports
      `);
      expect(summary.scheduled_today).toBe(expected.scheduled_today);
      expect(summary.completed_today).toBe(expected.completed_today);
      expect(summary.open_reports).toBe(expected.open_reports);
    });
  });

  describe("access control", () => {
    it("lets the service role read, write and run the functions", async () => {
      const scheduleId = await newSchedule();
      await client.query("set role service_role");
      try {
        await client.query("select * from cw_v_floor_progress");
        await client.query("select cw_collector_checkin($1, 43)", [scheduleId]);
        await client.query("select cw_update_report_status(3, 'IN_PROGRESS', 45)");
      } finally {
        await client.query("reset role");
      }
    });

    it("has row level security on every table", async () => {
      const { rows } = await client.query(
        "select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity",
      );
      expect(rows).toEqual([]);
    });

    it("does not let the public anon role run the check-in function", async () => {
      const scheduleId = await newSchedule();
      await client.query("set role anon");
      try {
        await expect(client.query("select cw_collector_checkin($1, 43)", [scheduleId])).rejects.toThrow(
          /permission denied/,
        );
      } finally {
        await client.query("reset role");
      }
    });
  });
});
