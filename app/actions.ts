"use server";

import type { Collector, DashboardSummary, FloorProgress, MissedReport } from "@/lib/types";

// All database reads and writes go through this file (imports `db` from lib/db.ts).
// Pages call these functions; they never talk to Supabase directly.

export async function getCollectors(): Promise<Collector[]> {
  // TODO(backend): active users with role COLLECTOR (role_id 2) from cw_users.
  return [];
}

export async function getTodaysFloors(): Promise<FloorProgress[]> {
  // TODO(backend): rows of cw_v_floor_progress for today (Malaysian date), ordered by floor_number.
  return [];
}

export async function checkIn(scheduleId: number, collectorId: number): Promise<void> {
  // TODO(backend): call the cw_collector_checkin database function; surface its error messages.
  void scheduleId;
  void collectorId;
  throw new Error("checkIn not implemented");
}

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  // TODO(backend): single row of cw_v_dashboard_summary.
  return null;
}

export async function getOpenReports(): Promise<MissedReport[]> {
  // TODO(backend): cw_missed_reports with status PENDING or IN_PROGRESS, newest first.
  return [];
}

export async function resolveReport(reportId: number, notes?: string): Promise<void> {
  // TODO(backend): call cw_update_report_status with 'RESOLVED' so resolved_at is recorded.
  void reportId;
  void notes;
  throw new Error("resolveReport not implemented");
}

export async function loginDashboard(formData: FormData): Promise<void> {
  // TODO(backend): compare to DASHBOARD_PASSWORD and set an httpOnly session cookie.
  void formData;
  throw new Error("loginDashboard not implemented");
}
