# CollectWise

Waste collection app for Block 2, Desa Mentari PPR. MPU 3422 project, Tutorial 18 Group 2.

- Collectors tap a floor in the app when it's collected
- JMB sees which floors are done on a dashboard
- Residents get an SMS before collection
- Residents reply to that SMS if their floor got missed, and it shows up as a report

## What's done / what's left

| Part | Where | Status |
|---|---|---|
| Check-in page | `app/checkin/page.tsx` | todo (frontend) |
| JMB dashboard + password | `app/dashboard/page.tsx` | todo (frontend) |
| Database functions | `app/actions.ts` | todo (backend) |
| SMS alerts before collection | `app/api/cron/alerts/route.ts` | todo (backend) |
| SMS reply → missed report | `app/api/sms/incoming/route.ts` | done |
| Sending SMS (textbee) | `lib/sms.ts` | done |
| Install on phone | `app/manifest.ts` | done |
| Database | `supabase/` | done |

Search the code for `TODO(frontend)` and `TODO(backend)`. Shared types are in `lib/types.ts`.

## How it works

```
collector taps floor  -> /checkin   -> actions.ts -> supabase
JMB opens dashboard   -> /dashboard -> actions.ts -> supabase

every 10 min          -> /api/cron/alerts  -> textbee -> SMS to residents
resident replies      -> textbee -> /api/sms/incoming -> new missed report
```

Pages never talk to Supabase directly, only through `app/actions.ts` (server side).

Stack: Next.js, Supabase, Vercel, textbee for SMS.

## Database

Moved over from Jun Hong's Oracle APEX version, same table names and his test data.
What got kept and dropped is in [docs/apex-reference.md](docs/apex-reference.md).

- `cw_floors` floors in Block 2
- `cw_users` residents, collectors, JMB, admins (role 1–4, same as APEX)
- `cw_collection_schedules` one row per floor per collection
- `cw_collection_logs` check-ins, one per schedule
- `cw_missed_reports` missed collection reports + when they got resolved
- `cw_notification_logs` every SMS sent

Views: `cw_v_floor_progress` (each floor today: pending/completed) and `cw_v_dashboard_summary` (today's counts).
Functions: `cw_collector_checkin` and `cw_update_report_status`.

## Setup

1. `npm install` (Node 20.6+)
2. Make a Supabase project, then in its SQL Editor run `supabase/schema.sql`, `seed.sql`, `data.sql` in that order
3. Copy `.env.example` to `.env.local` and fill it in (ask in the group, don't commit it)
4. `npm run dev` and open http://localhost:3000

## textbee (SMS)

1. Make an account on https://textbee.dev and install the app on an Android phone with a SIM
2. In the phone app turn on Receive SMS and set battery to Unrestricted
3. Put the API key and device ID in `.env.local`
4. Test it: `npm run sms:test -- 0123456789` (use your own number)
5. In the textbee dashboard add a webhook:
   - URL: `https://<our-app>.vercel.app/api/sms/incoming`
   - event: `MESSAGE_RECEIVED`
   - signing secret: same as `TEXTBEE_WEBHOOK_SECRET`

Free plan is 50 SMS a day / 300 a month, and replies count too.

## Deploying

Vercel deploys automatically when something is pushed to `main`. Add the `.env.example` variables in the Vercel project settings.

Vercel's free plan only runs cron once a day, so use something like cron-job.org to call
`/api/cron/alerts` every 10 minutes with the header `Authorization: Bearer <CRON_SECRET>`.

## Tests

```
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration   # database tests need DATABASE_URL
npm run test:e2e           # run npm run build first
```

Database tests wipe the database they connect to, so use a throwaway local Postgres, never Supabase.

GitHub Actions runs all of these on every push and PR.

## Rules

- Make a branch, open a PR, merge when the checks are green
- Never commit keys or real residents' phone numbers (this repo is public)
- Phone numbers are saved as `+60...`
