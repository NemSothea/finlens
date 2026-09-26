# finlens

Fundamentals-first stock research app. Own build — see `PLAN.md` for architecture,
build order and economics.

**Status:** Phases 1–8 complete and verified offline — foundation, ingest pipeline,
read paths, interactive valuation, accounts, paywall, payments, ops. The Flutter
client is at M2 (search on live API data) — see `finlens_mobile/README.md`.

## Quickstart

```bash
# 1. Firebase emulators (Firestore + Auth). Needs Java 21. The demo-finlens
#    project id is offline-only; no real Firebase project or keys needed.
#    Ports 8180/9199/4100 — the defaults are taken by another local project.
#    Data persists to .firebase/emulator-data on exit.
npm run emulators

# 2. Env — see the "Firebase (local emulator)" block in .env.example
cp .env.example .env.local

# 3. Data — no vendor key needed, runs against deterministic synthetic data
npm run ingest -- --stage=all --provider=fixture

# 4. A login (admin gets /ops)
npm run dev:user -- --email=dev@finlens.test --password=devpassword123 --admin

# 5. Checks
npm test          # 187 unit tests
npm run typecheck
```

Emulator UI (browse Firestore docs and Auth users): http://127.0.0.1:4100

### Production Firebase

1. Create a Firebase project; enable Authentication (Email/Password, optionally Google)
   and Firestore.
2. Service account key → `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
   `FIREBASE_PRIVATE_KEY`; web app config → the `NEXT_PUBLIC_FIREBASE_*` vars.
3. `npx firebase use <project-id> && npm run firebase:deploy-rules` — deploys the
   deny-all client rules and the composite indexes the queries need.

Port 3000 is occupied by another local project, so run the app on another port:

```bash
npm run dev -- -p 3001
```

## Real data

Get an [FMP](https://site.financialmodelingprep.com/developer/docs) key, put it in
`.env.local` as `FMP_API_KEY`, then drop `--provider=fixture`:

```bash
npm run ingest -- --stage=universe --limit=200
npm run ingest -- --stage=profiles
npm run ingest -- --stage=financials --years=30
npm run ingest -- --stage=quotes
npm run ingest -- --stage=valuations
```

Swapping vendor = implement `MarketDataProvider` (`src/lib/providers/types.ts`) and
register it in `src/lib/ingest/pipeline.ts`. Nothing else changes.

## Ops

The scheduled full pass runs in GitHub Actions (`.github/workflows/ingest.yml`) —
a serverless function cannot hold a 2,000-ticker vendor sweep inside its timeout.
Vercel cron (`vercel.json`) handles bounded slices and the hourly watchdog. Both
go through the same `runStages`, so manual backfills and schedules leave identical
`ingest_runs` history.

```bash
# Health: 200 ok/degraded, 503 when a critical stage is broken
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3001/api/cron/health

# Trigger a slice by hand
curl -H "Authorization: Bearer $CRON_SECRET" \
  "localhost:3001/api/cron/ingest?group=daily&limit=250"
```

`/ops` renders stage freshness, the run log and recorded errors for users whose
`role` is `admin` — anyone else gets a 404. Alerts go to Telegram once per
distinct problem set with a 6h cooldown, re-fire when a stage worsens, and
announce recovery once. See `PLAN.md` §11.

## Layout

```
src/db/schema.ts             tables — reference data, auth, subscriptions, portfolios, run log
src/lib/providers/           vendor adapters behind one interface (fmp, fixture) + rate limit/retry
src/lib/valuation/           DCF, reverse DCF, input derivation, sensitivity grid  (pure, 47 tests)
src/lib/queries/stocks.ts    the single read layer — RSC pages and JSON API both use it
src/lib/ingest/              run wrapper (observability), stage set, shared stage runner
src/lib/payments/            provider interface (payway, manual) + webhook ledger and transitions
src/lib/ops/                 freshness policy, health assessment, alerting, cron/dashboard access
src/components/              search typeahead, charts, interactive DCF panel
scripts/ingest/run.ts        CLI
```

## API

```
GET  /api/stocks/search?q=&limit=
GET  /api/stocks/:symbol
GET  /api/stocks/:symbol/financials?period=FY&years=
GET  /api/stocks/:symbol/prices?days=
POST /api/stocks/:symbol/valuation      body: partial DCF assumptions
GET  /api/compare?symbols=A,B

GET  /api/watchlist                     auth required
POST /api/watchlist                     body: { symbol, note?, targetPrice? }
DEL  /api/watchlist?symbol=

GET  /api/portfolio                     portfolio + derived positions
POST /api/portfolio                     body: a trade
DEL  /api/portfolio?transactionId=

POST /api/payments/webhook/:provider    signature-verified, replay-safe
GET  /api/cron/ingest?group=daily       Bearer CRON_SECRET
GET  /api/cron/health                   Bearer CRON_SECRET; 503 when critical
```

## Local accounts

```bash
npm run dev:user -- --email=you@example.com --password=at-least-8-chars
```

Dev only — the script refuses to run with `NODE_ENV=production`. Google sign-in
hides itself unless `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set; Telegram needs
`AUTH_TELEGRAM_BOT_TOKEN` and fails closed without it.

## Plans and payments

Checkout runs through a provider interface (`src/lib/payments/types.ts`); `manual`
is an offline provider whose callbacks are still HMAC-signed and verified by the
same code path as PayWay, so the whole lifecycle is exercisable without merchant
credentials:

```bash
npm run dev:checkout -- --email=you@example.com --plan=pro_monthly   # prints a reference
npm run dev:webhook  -- --reference=fl_… --type=payment.succeeded --amount=5
npm run dev:webhook  -- --reference=fl_… --event-id=evt_1            # replay: no double period
npm run dev:webhook  -- --reference=fl_… --bad-signature             # 400, nothing recorded
```

Or write the `subscriptions` row directly, to reach a lifecycle edge fast:

```bash
npm run dev:pro -- --email=you@example.com                       # active Pro, 30 days
npm run dev:pro -- --email=you@example.com --plan=free           # back to free
npm run dev:pro -- --email=you@example.com --status=past_due --days=-3   # inside grace
npm run dev:pro -- --email=you@example.com --status=canceled --days=5    # ending soon
```

See `PLAN.md` §10 for the tier table and enforcement rules.

## Rules this codebase holds to

- **No vendor call on the request path.** Pages read Firestore only. Cost then scales
  with universe size, not user count — that is what makes a $5/mo price work.
- **Every vendor response is zod-validated.** Vendors rename fields and return `[]`
  instead of errors; unvalidated ingest corrupts the DB silently.
- **Every stage is idempotent.** Upsert on a natural key, so re-runs and backfills
  are the same operation.
- **Partial failure is normal.** One dead ticker never aborts a 2,000-symbol run;
  it lands in `ingest_runs.errors`.
- **Positions are derived from transactions, never stored.** Keeps cost basis auditable.
- **The payment ledger is never rewritten backwards.** A late underpaid or failed
  callback moves the *subscription* to `past_due` but leaves a settled `payments`
  row `paid` — reconciliation has to be able to trust that record.
- **Alerting never breaks what it watches.** Sends are best-effort and
  rate-limited; a dead Telegram API cannot fail an ingest run.
- **One valuation formula, three surfaces.** The browser panel imports the same
  pure module the pipeline runs; the POST endpoint serves clients that cannot
  import TypeScript. Two implementations would mean two fair values for one
  company — the worst bug this product could ship.
