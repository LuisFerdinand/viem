# VIEM — Konekta Farms website & Hub dashboard demo

Company profile for **VIEM (Visionary Innovation for Environmental Management)** and a working demo of the
VIEM Hub dashboard, built for the **Vorakai Konekta Challenge 2026** (AI & Data track).

- **Website** — Home, About, Solution, Impact, Proposal (with PDF downloads and an in-page preview).
- **Dashboard demo** (`/dashboard`) — live sensors, controls, automation, Tetum-first alerts, harvest & buy-back,
  Buku Besar, preset master data, the Tulun VIEM assistant, and an activity log.

Stack: Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Drizzle ORM · Neon Postgres ·
Recharts · Lucide icons.

## Getting started

```bash
npm install
cp .env.example .env.local      # then paste your Neon connection string
npm run db:setup                # create tables and load demo data
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/dashboard for the demo.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:generate` | Generate a new SQL migration after editing `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations in `drizzle/` to the database |
| `npm run db:seed` | Reset all demo data to its starting state |
| `npm run db:studio` | Browse the database with Drizzle Studio |

If `DATABASE_URL` is missing or Neon is unreachable, the dashboard still works on in-memory demo data and shows an
"Offline demo mode" banner. An empty database is seeded automatically on first load.

## Deploying to Vercel

1. Push the repo to GitHub and import it at [vercel.com/new](https://vercel.com/new) — the Next.js preset needs no changes.
2. Under **Settings → Environment Variables**, add `DATABASE_URL` (Neon *pooled* connection string) and, if you use a
   custom domain, `NEXT_PUBLIC_SITE_URL` (e.g. `https://viem.tl`). Without it the Vercel production domain is used.
3. Run `npm run db:migrate` once against that database (locally, with the same `DATABASE_URL` in `.env.local`).
   Demo data is seeded automatically on the first dashboard load.

The Neon integration in the Vercel marketplace can also provision the database and set `DATABASE_URL` for you.
Without a database the site still deploys and the dashboard runs in "Offline demo mode".

## How the dashboard demo works

**Sensor readings are simulated in the browser and never stored.** While the dashboard is open, every unit takes a
reading every 30 seconds (air temperature, humidity, water level, pH, EC/TDS, water temperature and dissolved oxygen,
plus solar, battery and pump current). The feed **pauses automatically** when the tab is hidden or after 3 minutes
without interaction, and can be paused, resumed or triggered on demand from the top bar. On load, two hours of
history are generated as if synced from the controller's local buffer.

The model is physical enough to react to the controls: aeration raises oxygen, the pump refills the tank, irrigation
draws it down, circulation steadies temperature and pH, and there is a day/night cycle in Dili time.

**Controls** — each actuator (water pump, aeration, irrigation, water circulation) runs in one of three modes:

- *Manual* — the operator's switch.
- *Auto* — hysteresis rules, e.g. "aeration ON when oxygen < 5.5 mg/L, OFF when > 7.2 mg/L".
- *Schedule* — an on/off cycle on the local clock (e.g. 15 min on / 45 min off).

**Safety interlocks** override every mode, as they would on the ESP32 controller even without internet:
low-oxygen guard, dry-run protection and overflow protection.

**Alarms** — each sensor has normal and critical limits (editable, or apply a crop preset). Alarms are debounced and
use a deadband so a value hovering on a limit does not flap. Alerts follow the selected dashboard language,
go out "via WhatsApp" (or "SMS fallback" during a simulated link outage), and stay open until a person acknowledges
them. Unanswered alerts show the 2-hour response target from the pilot plan.

**Sensor categories** — Overview and Live sensors group readings into Basic monitoring (air temperature,
humidity, water level), Fish health (water temperature, dissolved oxygen), and Advanced water quality (pH, EC/TDS).
Each sensor explains its purpose, operator response and care. Some readings support both fish and plants.

**Navigation and languages** — the desktop sidebar groups pages into My farm, Harvest & money, and Help & settings.
Minimize it to an icon rail; hover or focus an icon for its translated tooltip. Sidebar size, Simple view, and the
Tetum / English / Bahasa Indonesia selection persist in browser preferences. Mobile uses a drawer with full labels,
keyboard focus containment, Escape dismissal, and focus restoration. Simple view starts enabled, provides page guides
and common-action shortcuts, and folds technical details into expandable sections. Turning it off reveals all details.

All dashboard application copy uses `lib/i18n.ts` and the shared `lib/translations.ts` catalogue, including chart legends,
forms, validation, activity messages, toasts, and assistant steps. Option values and saved records keep their canonical
values when labels translate; user-entered notes and names stay as entered. Dates and USD formatting follow the selected
language. New copy should be added to the catalogue with identical numbered placeholders. Tetum translations are a draft
and should receive native-speaker review before public release. Language selection covers the dashboard, not marketing pages.

Run `node node_modules/tsx/dist/cli.mjs --test scripts/dashboard.test.ts scripts/i18n.test.ts` for domain, translation
placeholder, dynamic-message, formatting, and Indonesian assistant-routing checks.

**Preset master data** (`/dashboard/presets`) — create, edit and duplicate crop/fish profiles by growth stage and
growing system. Each template stores seven alarm ranges and equipment rules. Saving a template does not change
unit settings. Applying alarms enables all seven alarms; selecting the equipment option also replaces that unit's
rules and switches the enabled template equipment to Auto mode in one database batch. Built-in demo profiles
cover shared tilapia/greens, NFT greens, fingerlings, lettuce and basil. Built-ins can be edited or duplicated;
custom profiles can also be deleted.

**Buku Besar** (`/dashboard/ledger`) — record and edit expenses or other income, including dates, notes, supplier/payer
and receipt references. Amounts are stored as integer USD cents. Paid harvests appear once as derived buy-back income
using the payment date; logged/collected harvests remain outstanding. Updating or deleting a harvest updates its
linked ledger row. Date filters, search, running balances and CSV export support reconciliation. Layouts adapt to
mobile screens. This is a cash record; the existing harvest forecast remains an illustrative production estimate.

Apply `npm run db:migrate` for the preset and ledger tables and harvest payment-date column before using these
features against Neon. Existing paid harvests use their harvest dates as historical payment dates because the old
schema did not capture payment dates. Ledger and harvest history is retained without the former 70-day query limit.
In fallback mode, ledger entries, harvests and master presets persist in this browser's local storage; equipment
settings retain the original session-only demo behavior. Database records remain the source of truth when connected.
Reset demo data clears these records too.

**Demo scenarios** on the Overview page inject a pump failure, heat wave, pH crash, tank leak or satellite-link
outage so you can watch alarms, automation and interlocks respond.

**What is stored in Neon:** units, alarm limits, actuator modes and manual states, automation rules, alerts,
people's actions (control, configuration, acknowledgements, maintenance, harvests, agronomist hand-offs) and harvest
records. Automation steps derived from the simulated readings stay in the browser session. Tables are pruned
automatically so the demo database stays small. *Activity & settings → Reset demo data* restores everything.

> The dashboard has no login because it is a public demo — anyone with the link can change demo data.
> Add authentication before connecting it to real equipment.

## Content notes

- Company copy, team and figures come from the VIEM company profile and the Konekta proposal
  (`public/downloads/`). Farm and team images were extracted from the company profile; supporting photography is
  from Unsplash.
- **Tetum strings** (alerts, Tulun VIEM answers) are drafts written for the demo — please have them reviewed by a
  native speaker and the VIEM agronomist before field use.
- Buy-back floor prices, sensor limits and simulation profiles are illustrative demo values.

## Project structure

```
app/(site)/          public website pages
app/dashboard/       dashboard routes (layout loads data from Neon)
components/site/     website components
components/dashboard/ dashboard shell, widgets and views
lib/db/              Drizzle schema, Neon client, seeding
lib/actions.ts       server actions (validated with Zod)
lib/sim/engine.ts    sensor model, control logic, interlocks, alarm debounce
lib/sim/store.ts     client store: 30 s feed loop, automation, alerts, persistence
lib/content.ts       website copy
drizzle/             SQL migrations
```
