// Shapes of the rows and views in supabase/schema.sql.

export type FloorProgress = {
  schedule_id: number;
  collection_date: string;
  start_time: string;
  schedule_status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  floor_id: number;
  block_name: string;
  floor_number: number;
  floor_label: string;
  log_id: number | null;
  checkin_time: string | null;
  collection_status: "COMPLETED" | "NEEDS_FOLLOW_UP" | null;
  progress_status: "COMPLETED" | "CANCELLED" | "PENDING";
};

export type DashboardSummary = {
  scheduled_today: number;
  completed_today: number;
  open_reports: number;
  active_users: number;
};

export type MissedReport = {
  report_id: number;
  resident_id: number;
  floor_id: number;
  schedule_id: number | null;
  description: string;
  report_status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  reported_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
};

export type Collector = {
  user_id: number;
  full_name: string;
};
