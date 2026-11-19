# From the Oracle APEX build

The database design comes from the team's Oracle APEX workspace (`WKSP_COLLECTION`, app 169118).
This file records what was carried over to Supabase and what was left out, so nothing is lost.

## Tables

| APEX table | Supabase | Notes |
|---|---|---|
| `CW_ROLES` | `cw_roles` | Same role IDs: 1 resident, 2 collector, 3 management, 4 admin |
| `CW_FLOORS` | `cw_floors` | Unchanged |
| `CW_USERS` | `cw_users` | Password hash and salt dropped (no APEX login) |
| `CW_COLLECTION_SCHEDULES` | `cw_collection_schedules` | Unchanged; `created_by` optional |
| `CW_COLLECTION_LOGS` | `cw_collection_logs` | Unchanged; one check-in per schedule |
| `CW_MISSED_REPORTS` | `cw_missed_reports` | Gains `report_category` from `CW_REPORTS` |
| `CW_REPORTS` | merged into `cw_missed_reports` | Categories and statuses mapped; photos not carried over |
| `CW_NOTIFICATION_LOGS` | `cw_notification_logs` | Unchanged; logs every SMS alert |
| `CW_COLLECTOR_LIVE_LOCATION` | not ported | GPS tracking is outside the pilot scope |
| `CW_COLLECTOR_VISITS` | not ported | Replaced by per-floor check-ins in `cw_collection_logs` |
| `CW_REGISTRATION_REQUESTS` | not ported | The team registers residents in person |
| `CW_SURVEY_RESPONSES` | not ported | The survey runs on Google Forms |

`CW_REPORTS` status mapping: `PENDING` → `PENDING`, `ASSIGNED` / `IN_PROGRESS` → `IN_PROGRESS`,
`COMPLETED` → `RESOLVED`, `REJECTED` → `REJECTED`.

## Views and code

| APEX object | Supabase |
|---|---|
| `CW_V_DASHBOARD_SUMMARY` | `cw_v_dashboard_summary` ("today" uses Malaysian time) |
| `CW_V_FLOOR_PROGRESS` | `cw_v_floor_progress` |
| `CW_APP_PKG.COLLECTOR_CHECKIN` | `cw_collector_checkin(schedule_id, collector_id, remarks)` |
| `CW_APP_PKG.UPDATE_REPORT_STATUS` | `cw_update_report_status(report_id, status, user_id, notes)` |
| `CW_AUTHENTICATE`, `CW_HASH_PASSWORD`, `CW_GET_USER_ROLE` | not ported (no APEX login) |
| `CW_REGISTER_RESIDENT`, `CW_APPROVE_RESIDENT` | not ported (in-person registration) |
| User triggers | replaced by column defaults |

## Pages

| APEX page | New app |
|---|---|
| 6 Collector Collection | `/checkin` |
| 1 Home, 4 Floor Management, 26 Report Management, 27 Report Details | `/dashboard` |
| 23 Create the report form | SMS reply → `/api/sms/incoming` |
| 8 Collector Monitoring, 9 Collector Dashboard, 36 Resident Live Tracking | not ported (GPS) |
| 10 / 14 User Management, 21 User Registration, 9999 Login | Supabase Table Editor for the pilot |

## Data

`supabase/data.sql` holds the APEX rows with their original IDs: 6 floors, 6 users and the
3 reports from `CW_REPORTS`. Password hashes are not carried over. Phone numbers and emails of
real people are left blank because this repository is public; add them in the Supabase Table Editor.
