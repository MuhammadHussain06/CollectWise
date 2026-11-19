# CollectWise

Waste-collection check-in and SMS alerts for Block 2, Desa Mentari PPR.
MPU 3422 community project, Tutorial 18, Group 2.

## Features

| Feature | Used by | What it does | Where | Status |
|---|---|---|---|---|
| Collector check-in | Collectors | Pick your name, tap a floor, check-in time is saved | `/checkin` | UI and data to do |
| JMB dashboard | JMB / team | Today's floors with check-in times, summary counts, open reports, Resolve button | `/dashboard` | UI and data to do |
| Dashboard password | JMB / team | One shared password protects the dashboard | `/dashboard` | To do |
| SMS alerts | Residents | Texts each floor's residents before its round; every SMS is logged | `/api/cron/alerts` | To do |
| Missed-collection reports | Residents | Replying to an alert creates a report for that floor | `/api/sms/incoming` | Done |
| Installable app | Everyone | Add to Home Screen, opens full screen | `app/manifest.ts` | Done |

Pilot targets these features measure: residents signed up, alerts sent, floors checked in,
time to resolve missed reports.

## How it fits together

```
Collector phone ──tap floor──▶ /checkin ──▶ actions.ts ──▶ Supabase
                                                              │
JMB laptop ◀──floor status, reports── /dashboard ◀────────────┘

Scheduler (every 10 min) ──▶ /api/cron/alerts ──▶ textbee ──SMS──▶ Resident
Resident reply ──SMS──▶ textbee ──webhook──▶ /api/sms/incoming ──▶ Supabase (report)
```

- Pages only call `app/actions.ts`; only server code talks to Supabase.
- textbee sends and receives SMS through an Android phone with a SIM.

## Data

| Table | Holds |
|---|---|
| `cw_floors` | Block 2 floors |
| `cw_users` | Residents, collectors, JMB and admins, with phone number and floor |
| `cw_roles` | 1 resident, 2 collector, 3 management (JMB), 4 admin |
| `cw_collection_schedules` | One row per floor per collection round |
| `cw_collection_logs` | One check-in per schedule |
| `cw_missed_reports` | Missed-collection reports and when they were resolved |
| `cw_notification_logs` | Every SMS alert and whether it was sent |

| View / function | Use |
|---|---|
| `cw_v_floor_progress` | Each schedule with PENDING / COMPLETED / CANCELLED |
| `cw_v_dashboard_summary` | Today's scheduled, completed, open reports, active users |
| `cw_collector_checkin(schedule, collector)` | Records a check-in; blocks duplicates and non-collectors |
| `cw_update_report_status(report, status, user)` | Changes status; sets `resolved_at` when RESOLVED |

Ported from the team's Oracle APEX build, including its test data: see
[docs/apex-reference.md](docs/apex-reference.md).

## Stack

| Part | Tool |
|---|---|
| App | Next.js (App Router, TypeScript) |
| Database | Supabase (Postgres) |
| Hosting | Vercel |
| SMS | textbee |
| Tests | Vitest, Playwright |

## Project structure

```
app/
  page.tsx                 home
  checkin/page.tsx         collector check-in              TODO(frontend)
  dashboard/page.tsx       JMB dashboard                   TODO(frontend)
  actions.ts               all database reads and writes   TODO(backend)
  api/cron/alerts/         SMS alerts before each round    TODO(backend)
  api/sms/incoming/        SMS reply -> report             done
  manifest.ts              installable app
lib/
  db.ts                    Supabase client (server only)
  sms.ts                   send SMS, normalize phone numbers
  textbee-webhook.ts       verify webhook signatures
  time.ts                  today's date in Malaysia
  types.ts                 shared row and view types
supabase/
  schema.sql  seed.sql  data.sql
tests/unit/                unit tests
tests/integration/         API route and database tests
e2e/                       browser tests
scripts/test-sms.mjs       send one test SMS
```

## Getting started

1. Install Node.js 20.6+, then `npm install`.
2. Create a Supabase project (Singapore region). In the SQL Editor run, in order:
   `supabase/schema.sql`, `supabase/seed.sql`, `supabase/data.sql`.
3. Copy `.env.example` to `.env.local` and fill it in. Get values from the team; never commit them.
4. `npm run dev`, then open http://localhost:3000.

| Variable | From |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID` | textbee dashboard |
| `TEXTBEE_WEBHOOK_SECRET` | Any 20+ character string, also set on the textbee webhook |
| `DASHBOARD_PASSWORD` | Chosen by the team |
| `CRON_SECRET` | Any random string, also set on the scheduler |
| `ALERT_LEAD_MINUTES` | Minutes before a round to send alerts (default 60) |

## Linking a textbee account

1. Sign up at https://textbee.dev; install the textbee app on an Android phone with a SIM and sign in.
2. On the phone: turn on **Receive SMS**, set battery to **Unrestricted**, keep it charged and online.
3. Dashboard → API keys: set `TEXTBEE_API_KEY`. Devices: set `TEXTBEE_DEVICE_ID`.
4. Test: `npm run sms:test -- 0123456789` (your own number).
5. Dashboard → Webhooks → add:
   - URL `https://<app>.vercel.app/api/sms/incoming`
   - Event `MESSAGE_RECEIVED`
   - Signing secret = `TEXTBEE_WEBHOOK_SECRET`
6. Reply to the test SMS from a number in `cw_users`; a row appears in `cw_missed_reports`.

Free plan: 50 messages a day, 300 a month; sent and received both count.

## Deploying

1. Import the repo into Vercel and add every variable from `.env.example`.
2. Pushes to `main` deploy automatically.
3. Alerts: Vercel's free plan runs cron only once a day, so call `/api/cron/alerts` every 10 minutes
   from a free scheduler (e.g. cron-job.org) with header `Authorization: Bearer <CRON_SECRET>`.

## Testing

| Command | Covers | Needs |
|---|---|---|
| `npm run lint` | Code style and React rules | – |
| `npm run typecheck` | TypeScript types | – |
| `npm run test:unit` | Phone formatting, SMS sending, webhook signatures, Malaysian date | – |
| `npm run test:integration` | SMS webhook route; schema, data import, constraints, functions, views, row level security | `DATABASE_URL` to a throwaway Postgres for the database tests |
| `npm run test:e2e` | Pages, navigation, 404, installable manifest, API security, on desktop and mobile | `npm run build` first; `npx playwright install chromium` once |

Database tests drop and recreate the `public` schema: never point `DATABASE_URL` at Supabase.

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:

| Job | Runs |
|---|---|
| Lint and type check | `lint`, `typecheck` |
| Unit tests | `test:unit` |
| Integration tests | `test:integration` against a Postgres 16 service |
| End-to-end tests | build, then `test:e2e`; uploads the report on failure |
| Dependency audit | `npm audit` for critical issues |
| Deploy to Vercel | on `main` after all jobs pass, only if the secrets below exist |

To deploy only after tests pass: add repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
(from `vercel link`, in `.vercel/project.json`), then turn off automatic Git deploys in Vercel.
Without the secrets, Vercel's own Git integration deploys.

Dependabot opens weekly update PRs for npm packages and GitHub Actions.

## Team workflow

- Frontend: search `TODO(frontend)`. Backend: search `TODO(backend)`.
- `lib/types.ts` is the contract between the two.
- Work on a branch, open a pull request, merge when CI is green.

## Privacy

- Phone numbers are stored as `+60XXXXXXXXX`, used only for pilot alerts, deleted after the pilot.
- Supabase is reached only from server code with the service role key; row level security is on
  with no public access.
- This repo is public: never commit keys or real residents' details.
