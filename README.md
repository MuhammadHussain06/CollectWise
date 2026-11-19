# CollectWise

A waste-collection check-in and alert system for Block 2, Desa Mentari PPR.
Built for the MPU 3422 community project (Tutorial 18, Group 2).

Collectors tap a floor on their phone when it has been collected. The JMB sees each floor's
status on a dashboard. Residents get an SMS before each collection round, and can reply to
that SMS to report a missed collection.

## What the pilot needs

1. **Collector check-in:** pick your name, tap a floor, and the check-in time is saved.
2. **JMB dashboard:** today's floors with check-in times, plus open missed-collection reports.
3. **Automated SMS alerts:** residents of a floor are texted before its round; every SMS is logged.
4. **Missed-collection reports:** a resident replies to the alert; the JMB marks it resolved.

## Stack

| Part | Tool |
|---|---|
| App (pages and server code) | Next.js (App Router, TypeScript) |
| Database | Supabase (Postgres) |
| Hosting | Vercel |
| SMS | textbee, on an Android phone with a SIM |

The database design comes from the team's earlier Oracle APEX build.
See [docs/apex-reference.md](docs/apex-reference.md) for what was carried over.

## Project structure

```
app/
  page.tsx                  home, links to the two screens
  checkin/page.tsx          collector check-in                         (frontend)
  dashboard/page.tsx        JMB dashboard                              (frontend)
  actions.ts                every database read and write              (backend)
  api/cron/alerts/          sends SMS alerts before each round         (backend)
  api/sms/incoming/         turns SMS replies into reports             (backend)
  manifest.ts               makes the app installable on phones
lib/
  db.ts                     Supabase client, server only
  sms.ts                    textbee wrapper                            (backend)
  types.ts                  row and view types shared by both sides
supabase/
  schema.sql                tables, views and functions
  seed.sql                  roles
  data.sql                  floors, users and reports from the APEX build
docs/
  apex-reference.md         mapping from the Oracle APEX build
```

Pages only call functions in `app/actions.ts`; they never query Supabase directly.
Look for `TODO(frontend)` and `TODO(backend)` to see what is left.

## Setup

1. **Install:** Node.js 20 or newer, then `npm install`.
2. **Database:** create a Supabase project (Singapore region). In its SQL Editor, run
   `supabase/schema.sql`, then `supabase/seed.sql`, then `supabase/data.sql` (the APEX test data).
3. **Environment:** copy `.env.example` to `.env.local` and fill it in. Ask the team for the values;
   never commit them.
4. **Run:** `npm run dev`, then open http://localhost:3000.

## Deploying on Vercel

1. Import this repository into Vercel.
2. Add every variable from `.env.example` under Project Settings → Environment Variables.
3. Every push to `main` redeploys.

**SMS alerts schedule:** Vercel's free plan only runs cron jobs once a day, so call
`/api/cron/alerts` every 10 minutes from a free external scheduler (for example cron-job.org)
with the header `Authorization: Bearer <CRON_SECRET>`.

**SMS replies:** in textbee, turn on Receive SMS on the gateway phone and set the webhook URL to
`https://<your-app>.vercel.app/api/sms/incoming`, secured with `SMS_WEBHOOK_SECRET`.

## Data and privacy

- Residents' phone numbers are stored only for pilot alerts and deleted after the pilot.
- The database is only accessed from server code with the service role key; row level security
  is on with no public policies.
- Phone numbers are stored as `+60XXXXXXXXX` so SMS replies can be matched to residents.
