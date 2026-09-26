# finlens — implementation plan

Fundamentals-first stock research app. Own build, own branding, own copy.
Reference architecture derived from public technical signals of comparable products
(Next.js on Vercel, Auth.js, local payment rails). No third-party assets or copy reused.

---

## 0. Product scope (MVP)

| # | Capability | Why it ships in MVP |
|---|---|---|
| 1 | Ticker search + company detail | Core loop. Nothing works without it. |
| 2 | 10–30yr financial history charts | The actual differentiator vs free tools. |
| 3 | Intrinsic value (DCF + reverse DCF) | Highest-value feature, cheapest to build. |
| 4 | Compare two tickers | Reuses detail-page components. Near-free. |
| 5 | Watchlist | Retention hook. |
| 6 | Portfolio (transactions → positions) | Retention hook + upgrade trigger. |
| 7 | Auth + paywall | Gate 2–6. |
| 8 | Payments | Last. Manual invoicing works until ~50 users. |

Explicitly **out** of MVP: realtime quotes, options, screener builder, mobile app,
news feed, social features, video course hosting (use YouTube unlisted + gate the links).

---

## 1. Architecture

```
                    ┌──────────────────────────┐
  vendor API   ───▶ │  ingest pipeline (tsx)   │ ──▶  Postgres
  (FMP/EODHD)       │  cron: nightly + weekly  │      (own copy of all data)
                    └──────────────────────────┘
                                                        │
                                                        ▼
                    ┌──────────────────────────────────────────┐
   browser  ◀────── │  Next.js 16 App Router (RSC) on Vercel   │
                    │  Auth.js v5 · Drizzle · server actions   │
                    └──────────────────────────────────────────┘
```

**Hard rule: no vendor API call on the request path.** Every page read hits our
Postgres only. Vendor is touched exclusively by the ingest pipeline. Reasons:

- Vendor per-call quotas would be burned by bots and page refreshes.
- Vendor latency (300–900ms) would sit inside every page render.
- Vendor outage would take the whole product down.
- We need historical snapshots the vendor overwrites.

**Cost model consequence:** cost scales with *universe size*, not *user count*.
Ingesting 2,000 tickers costs the same whether we have 10 users or 10,000.
That is what makes $5/mo viable.

---

## 2. Data layer

### Tables (see `src/db/schema.ts`)

| Table | Grain | Notes |
|---|---|---|
| `companies` | 1 row / symbol | profile, exchange, sector, active flag |
| `financial_statements` | 1 row / symbol / period | annual + quarterly, all three statements flattened |
| `quotes` | 1 row / symbol | latest price, market cap, shares out |
| `price_history` | 1 row / symbol / day | for charts + return calcs |
| `valuations` | 1 row / symbol / method | cached DCF output + assumptions snapshot |
| `users`,`accounts`,`sessions` | Auth.js | standard adapter shape, plus `role` (`'user'` \| `'admin'`) for `/ops` access |
| `subscriptions` | 1 row / user | plan, status, period end, payment provider ref |
| `watchlist_items` | 1 row / user / symbol | |
| `portfolios`, `transactions` | transactions are the source of truth | positions are derived, never stored |
| `ingest_runs` | 1 row / pipeline run | observability. Non-negotiable. |

### Why transactions, not positions

Storing positions means every corporate action, partial sell, and cost-basis
question becomes a destructive update you cannot audit. Store the immutable
transaction log; derive positions on read. Cheap at retail portfolio sizes.

---

## 3. Ingest pipeline

Stages, run independently, each idempotent (upsert on natural key):

| Stage | Cadence | Volume (2k universe) | Vendor calls |
|---|---|---|---|
| `universe` | weekly | 1 | ~1 |
| `profiles` | weekly | 2,000 | 2,000 |
| `financials` | quarterly + on earnings | 2,000 | ~6,000 (income/balance/cashflow) |
| `quotes` | daily after close | 2,000 | ~20 (batched) |
| `prices` | daily | 2,000 | 2,000 (incremental, last N days) |
| `valuations` | after financials or quotes | 2,000 | 0 (pure compute) |

*Volume column is planning math for the target 2,000-symbol universe, not the
current dev state — local Postgres today holds the 10-symbol fixture universe
(`FixtureProvider.UNIVERSE` in `src/lib/providers/fixture.ts`): 10 companies,
300 `financial_statements` rows, 26,080 `price_history` rows, verified live
2026-08-22.*

Design rules baked into `src/lib/ingest/`:

- **Concurrency limiter + rate limiter.** Vendors ban on burst.
- **Retry with backoff** on 429/5xx only. Never retry 4xx.
- **Zod-validate every vendor response.** Vendors silently change field names
  and return `[]` instead of an error. Unvalidated ingest corrupts the DB quietly.
- **Partial failure is normal.** One bad ticker must not abort the run.
  Record per-symbol failure in `ingest_runs`, continue.
- **Provider interface, not vendor SDK.** `MarketDataProvider` in
  `src/lib/providers/types.ts`. Swapping FMP → EODHD is one file.

### Vendor choice

*Pricing and coverage below are vendor-published figures at time of writing,
not something this repo can verify — re-check against the vendor's current
pricing page before budgeting.*

| Vendor | ~Cost/mo | History | Global (HKEX/LSE) | Verdict |
|---|---|---|---|---|
| Financial Modeling Prep | $20–80 | 30yr | decent | **start here** — cheapest full fundamentals |
| EODHD | $20–100 | 20–30yr | best | switch if global coverage matters |
| Polygon.io | $30–200 | strong US | weak | US-only play |
| Alpha Vantage / Finnhub free | $0 | thin | thin | prototyping only |

Start FMP. Provider interface makes the switch cheap later.

---

## 4. Valuation engine (`src/lib/valuation/`)

Pure functions, zero I/O, unit-tested. This is the feature users pay for, so it
must be inspectable and defensible.

- **Two-stage DCF** — explicit forecast horizon with optional linear fade from
  stage-1 growth to terminal growth, then Gordon terminal value.
  Guard: `discountRate > terminalGrowthRate` or the terminal value is meaningless.
- **Reverse DCF** — bisection solve for the growth rate the *current price*
  implies. More honest than a point estimate: it reframes "is this cheap?" into
  "is this growth assumption believable?".
- **Margin of safety** against current price.
- **Assumption snapshot** stored with every cached valuation, so a number on
  screen can always be explained.

- **Sensitivity grid** (`sensitivity.ts`) — growth × discount-rate matrix plus a
  *support ratio*: the share of assumption pairs that still put the company below
  fair value. A single number invites false precision; the spread is the honest
  answer. Cells where `r <= g` are marked invalid rather than throwing and
  taking the whole grid down.
- **Input derivation** (`inputs.ts`) — turns stored fundamentals into the
  company-specific half of the assumptions (base FCF, share count, net debt),
  with typed failures and data-quality warnings. One implementation, three
  callers: the ingest stage, the detail page, and the valuation endpoint.
  Without it, the same company shows different fair values depending on which
  surface you look at.

Deliberately *not* automated: growth and discount rate are user inputs with
sane defaults. Auto-fitting them produces confident-looking garbage.

**Where the math runs.** The browser panel imports the same pure module the
pipeline uses, so live editing needs no round trip and cannot disagree with the
cached number. The POST endpoint exists for clients that cannot import
TypeScript — i.e. Flutter. Three surfaces, one formula.

### Worked example — one symbol, end to end

Pulled live from local Postgres 2026-08-22 (`docker exec finlens-pg psql -U
finlens -d finlens`), symbol `AAPL`. **These are `FixtureProvider`-generated
numbers, not real Apple financials** — the fixture deterministically derives
every figure from a hash of the symbol string (`src/lib/providers/fixture.ts`)
specifically so the pipeline can be exercised without a vendor key. Swapping in
`--provider=fmp` against a real key would carry the same fields through the
same code path onto real numbers.

| Stage | Value |
|---|---|
| `financial_statements`, FY2025 | revenue $109.1B · free cash flow $13.4B · total debt $24.1B · cash $23.9B · shares diluted 4.66B |
| `quotes` | price $71.44 · market cap $333.1B · P/E 22.4 |
| `deriveDcfInputs` (`src/lib/valuation/inputs.ts`) | `baseFreeCashFlow` $12.43B (3yr average, not the latest single year) · `netDebt` $0.22B · `sharesOutstanding` 4.66B (live quote, not the statement count) |
| `calculateDcf` defaults | `growthRate` 8% · `growthYears` 10, fading to `terminalGrowthRate` 2.5% · `discountRate` 10% |
| `valuations` row (`method='dcf'`) | fair value/share **$45.49** · margin of safety **-57%** (price above fair value on these assumptions) · reverse DCF implied growth **19.5%** |

That last row is what `GET /api/stocks/AAPL` and the company detail page both
read — same cached row, same number, by construction (§ above).

---

## 5. Build order

| Phase | Work | Gate to pass |
|---|---|---|
| **1. Foundation** ✅ | scaffold, schema, provider interface, DCF + tests | `npm test` green |
| **2. Pipeline** ✅ | FMP client, ingest stages, fixture provider, end-to-end run | 10 companies × 30yr financials + 26k price bars in Postgres, re-run idempotent |
| **3. Read paths** ✅ | query layer, JSON API, search, detail page, charts, compare | detail page renders from DB only, no vendor call |
| **4. Valuation UI** ✅ | DCF panel with editable assumptions, reverse DCF, sensitivity grid, POST valuation endpoint | endpoint defaults match the cached pipeline value exactly; fair value monotonic in growth and discount rate |
| **5. Accounts** ✅ | Auth.js (Google + credentials + Telegram), watchlist, portfolio, per-user API | positions derived correctly over HTTP; cross-user isolation verified on every route |
| **6. Paywall** ✅ | entitlement resolution, proxy + per-handler gates, plan limits, pricing page | free user blocked at every surface; grace/cancel/expiry edges verified live |
| **7. Payments** ✅ | provider integration + webhook → `subscriptions` | webhook replay is idempotent |
| **8. Ops** ✅ | cron on ingest, error alerting, `ingest_runs` dashboard | failed nightly run is visible without checking logs |
| **M1–M5. Mobile** | Flutter client — see §8 (M1–M2 ✅) | runs on device against the same JSON API |

Phases 1–4 are the product. 5–8 are the business. Do not reorder — a paywall
around a thin product churns.

Mobile starts after phase 4, not before: the API contract has to stop moving
first, or every web change becomes a mobile rewrite. M1–M3 can then run in
parallel with phases 5–8.

---

## 6. Economics reality check

*Everything below is a business estimate, not a code fact — it lives outside
this repo (vendor invoices, hosting bills) and cannot be verified by reading
source. Sourced from the vendor comparison in §3 and typical Vercel/Postgres
list pricing at time of writing; re-check against actual invoices before
relying on it.*

Fixed monthly: vendor $20–80 + Postgres $0–25 + Vercel $0–20 ≈ **$20–125/mo**.

At $5/mo with ~85% payment-processor-net (typical Stripe/PayPal-class take
rate — not yet measured against a real processor here): breakeven ≈ **5–30
paying users**.
Low. The constraint is not infrastructure — it is distribution.

The defensible asset is an audience, not this code. Anyone can buy the same
vendor feed. Build the content channel in parallel with the product, or this
ships into silence.

---

## 7. Commands

```bash
npm run dev            # app
npm test               # unit tests: valuation, billing, payments, ops
npm run db:push        # sync schema to Postgres (dev)
npm run db:generate    # emit SQL migration (prod)
npm run db:studio      # browse data

npm run ingest -- --stage=universe
npm run ingest -- --stage=profiles   --symbols=AAPL,MSFT,GOOGL
npm run ingest -- --stage=financials --symbols=AAPL --years=30
npm run ingest -- --stage=quotes     --limit=500
npm run ingest -- --stage=valuations
npm run ingest -- --stage=all        --limit=50
```

---

## 8. Mobile app — Flutter

Conventions below follow the course material at
`~/Desktop/LifeLinkKh/mobile/docslesson` (Weeks 1–6). Same architecture, same
naming, same discipline — so the two codebases stay one mental model, not two.

### 8.1 Why Flutter, and why the API came first

The web app already computes everything server-side and reads only from our own
Postgres. That means the mobile client needs **no new backend** — it consumes the
same JSON routes the web pages use (§9). One query layer
(`src/lib/queries/stocks.ts`) feeds both RSC pages and route handlers, so a
schema change lands in web and mobile at the same time instead of drifting.

Concretely: mobile costs an app, not a platform.

### 8.2 Project shape

```
finlens_mobile/
├── pubspec.yaml
├── lib/
│   ├── main.dart                 ← runApp() ONLY
│   └── src/
│       ├── app.dart              ← MaterialApp.router, Material 3 theme
│       ├── router/
│       │   └── app_router.dart   ← one router, one file, centralised paths
│       ├── core/
│       │   ├── network/          ← Dio client, interceptors, base URL per flavor
│       │   ├── domain/           ← shared Failure + Result<T>
│       │   └── theme/
│       └── features/
│           ├── search/
│           ├── stock_detail/
│           ├── watchlist/
│           ├── portfolio/
│           └── auth/
└── test/
```

Every feature is the same four layers, no exceptions:

```
features/stock_detail/
├── domain/         entities + abstract repository contract + failures
├── data/           concrete repository (Dio), DTOs, platform→domain error mapping
├── application/    service (Six Rules) + Riverpod notifiers
└── presentation/   screens + widgets
```

### 8.3 Stack

| Concern | Choice | Why this one |
|---|---|---|
| State | **Riverpod** (`@riverpod` codegen, `AsyncNotifier`) | compile-safe DI, `AsyncValue` gives the four states for free |
| Routing | **go_router** | deep links, auth redirect guard, testable in isolation |
| HTTP | **Dio** | interceptors for auth token + retry, one place to attach them |
| Local cache | **Drift** | typed SQL; the app is read-heavy and offline-friendly by nature |
| Models | **freezed** + `json_serializable` | immutability + unions + generated `fromJson` |
| Codegen | **build_runner** | one command, everything above depends on it |
| Test | `flutter_test`, `mocktail` | repositories are abstract, so mocking is trivial |

### 8.4 Non-negotiable patterns (straight from the course)

**Errors are values, not throws.** Repositories return `Future<Result<T>>`.
`Result<T>` is a sealed union of `Success<T>` / `Failed<T>`; `Failure` is a
sealed union of the domain's failure variants. The signature stops lying and the
compiler enforces that the UI handles every variant.

```dart
// domain/result.dart
sealed class Result<T> {}
class Success<T> extends Result<T> { const Success(this.value); final T value; }
class Failed<T>  extends Result<T> { const Failed(this.failure); final Failure failure; }
```

**The data layer is where platform errors get translated.** `DioException` and
`SqliteException` die in `data/`. The UI never sees them — it pattern-matches on
`Failure` variants and renders a typed error state per variant.

| Layer | Responsibility |
|---|---|
| Platform | `DioException`, `SqliteException` |
| Data | catches platform errors, returns `Failed(...)` |
| Application | passes `Failure` up unchanged |
| Presentation | pattern-matches per variant |

**Four states, always.** Every async screen renders loading / error / empty /
data. Empty is not a special case of data — it gets its own widget with a clear
next action. Loading is a skeleton, not a spinner.

```dart
state.when(
  loading: () => const LoadingSkeleton(),
  error:   (e, _) => ErrorState(failure: e is Failure ? e : const UnknownFailure()),
  data:    (list) => list.isEmpty ? const EmptyState() : StockList(list),
);
```

**Six Rules of the Service.** One per feature; stateless; returns domain types;
depends on abstractions; never imports `flutter/material.dart`; orchestrates and
never renders. A service that breaks any of these is not a service.

**Routing is declarative.** No `Navigator.push` with a `MaterialPageRoute`
literal — that kills deep linking, auth guards, and testability. All paths are
constants on `AppRouter` in one file.

**`StatefulWidget` only for widget-lifecycle state** — controllers, animations,
focus nodes, created and disposed in the surrounding `State`. Business state
lives in a Notifier.

### 8.5 Mobile build order

| Phase | Work | Gate to pass |
|---|---|---|
| **M1. Skeleton** ✅ | project, flavors (dev/prod base URL), Material 3 theme, go_router with 3 routes | app runs on device, routes deep-link |
| **M2. Core** ✅ | Dio client, `Result`/`Failure`, generated DTOs for §9 responses | one screen shows real data from the API |
| **M3. Read features** | search, stock detail (metrics + charts), compare | all four states demonstrable on device |
| **M4. Accounts** | auth via the same Auth.js session/token, watchlist, portfolio | auth guard redirect works, offline read from Drift |
| **M5. Ship** | KHQR/PayWay handoff, store builds, crash reporting | signed build on both stores |

Charts: `fl_chart`. Keep the same visual grammar as web — a user should not have
to relearn the product between screens.

### 8.6 What mobile must NOT do

- **No valuation math in Dart.** DCF stays server-side. Two implementations of
  the same formula will diverge, and the divergence will show up as two different
  fair values for one company — the single worst bug this product could ship.
- **No direct vendor calls.** Same rule as web, for the same reasons.
- **No business rules in widgets.** If it can be unit-tested without Flutter, it
  belongs in `application/` or `domain/`.

---

## 9. API contract (shared by web and mobile)

Route handlers in `src/app/api/`, all reading the same query layer as the RSC
pages. JSON. These reads are **intentionally public** — no session required —
because the free tier is a real product (§10): anonymous callers get
`ANONYMOUS_ENTITLEMENT` (`src/lib/billing/entitlements.ts:70`), the same free
limits a signed-in free user gets, not a locked-out response.

| Route | Returns |
|---|---|
| `GET /api/stocks/search?q=&limit=` | `{ results: [{ symbol, name, exchange, sector, price, marketCap }] }` |
| `GET /api/stocks/:symbol` | `{ company, quote, valuation, metrics, latest }` |
| `GET /api/stocks/:symbol/financials?period=FY&years=` | `{ symbol, period, count, truncatedByPlan, yearsAvailableOnPlan, statements: [...] }` — `years` clamped server-side to the caller's `financialYears` limit |
| `GET /api/stocks/:symbol/prices?days=` | `{ symbol, days, count, truncatedByPlan, bars: [{ tradeDate, close, volume }] }` — `days` clamped to `priceHistoryDays` |
| `POST /api/stocks/:symbol/valuation` | body = partial assumptions → `{ assumptions, result, marginOfSafety, reverseDcf, sensitivity, warnings }`. **402** if the caller's plan lacks `interactiveValuation` |
| `GET /api/compare?symbols=A,B` | `{ count, missing, truncatedByPlan, compareLimit, items: [ …same shape as detail… ] }` — `symbols` clamped server-side to `limits.compareSymbols`, same as the `/compare` RSC page |

`/api/compare` sits outside `/api/stocks/` deliberately — under it, the static
segment would shadow the `[symbol]` dynamic route forever.

### Per-user routes (auth required)

| Route | Returns |
|---|---|
| `GET/POST/DELETE /api/watchlist` | list · add `{symbol, note?, targetPrice?}` · remove `?symbol=` |
| `GET/POST/DELETE /api/portfolio` | portfolio + derived positions · append trade · delete trade `?transactionId=` |

Auth is the Auth.js session cookie today. The mobile client needs a bearer
token instead — that lands with M4, and these handlers are where it plugs in.

**Positions are computed server-side and returned already derived.** Mobile
renders them; it does not recompute cost basis. Same rule as the DCF, same
reason: two implementations produce two different portfolios.

### Authorisation rules

- Every per-user query takes `userId` as its first argument and filters on it.
  There is no "get by id" that does not also scope to the owner — a missing
  `WHERE` here is a cross-account data leak.
- Ownership is checked server-side on every mutation. `portfolioId` arrives
  from the client and is never trusted.
- "Not yours" and "does not exist" return the **same** response, so ids
  belonging to other users cannot be probed.
- Registration returns the same message whether or not the email is taken —
  otherwise the form is an account enumerator.

---

## 10. Paywall

### Roles & access

Four access tiers exist in this codebase today. There is no single `role`
column driving all of them — plan/subscription state and the admin flag are
separate, orthogonal checks:

| Tier | What grants it | Enforced by |
|---|---|---|
| Anonymous | no session cookie | `getCurrentEntitlement()` returns `ANONYMOUS_ENTITLEMENT` for a null session (`src/lib/queries/billing.ts:43`); gated *pages* (`/watchlist`, `/portfolio`) redirect to `/signin` via the `proxy.ts` fast path (`src/proxy.ts:38`) |
| Free user | signed in, no `active`/`trialing`/in-grace `past_due` row in `subscriptions` | `resolveEntitlement()` returns `FREE_LIMITS` for every non-qualifying state (`src/lib/billing/entitlements.ts:52`, `:108`) |
| Pro user | `subscriptions.status` is `active`/`trialing` with a valid period, `canceled` before period end, or `past_due` within the 7-day grace | same `resolveEntitlement()` (`entitlements.ts:108`); re-resolved per request, not cached across requests (`billing.ts:15`) |
| Admin | `users.role = 'admin'` | `isAdminRole()` (`src/lib/ops/access.ts`), checked in `OpsPage` (`src/app/ops/page.tsx:55`) — `notFound()` for everyone else. Independent of plan: an admin's `subscriptions` row (or lack of one) is untouched by this flag |

Admin gates only `/ops` (pipeline observability, §11) — it carries no product
entitlement. A user can be `role='admin'` and still be on the free plan, or
vice versa.

### Tiers

| | Free | Pro — $5/mo, $50/yr |
|---|---|---|
| Search, profiles, DCF fair value | yes | yes |
| Financial history | 5 years | 30 years |
| Editable assumptions, sensitivity, projection | no | yes |
| Compare | 2 at a time | 4 at a time |
| Watchlist | 3 companies | unlimited |
| Portfolio tracking | no | yes |
| Price history | 1 year | full |

The free tier is a real product, not a demo. Free users still see the fair value
and margin of safety — the gate is on *tuning* the model, not on knowing what it
says. Walling off every number trains people to leave rather than to pay.

### Enforcement rules

- **Entitlement is resolved server-side and re-checked at every surface** —
  page, Server Action and JSON route alike. Hiding a button is presentation.
- **Limits are applied to the query, not the render.** A free user's extra 25
  years are never fetched, so they cannot be recovered from the RSC payload.
  Blurring rows client-side would ship the data and hide it with CSS.
- **`proxy.ts` is a fast path, not the boundary.** It only checks for a session
  cookie. Next's docs warn that a matcher change can silently drop coverage, so
  deleting the file must cost a redirect, not open the paywall.
- **Fail closed.** An unrecognised plan or status never grants access.
- **Trust the clock over the flag.** An `active` row whose period has already
  ended is treated as lapsed — that state means a missed webhook.
- **402, not 403,** when identity is known and payment is what's missing.
- Limits **clamp** rather than reject (`truncatedByPlan: true`), so clients
  don't have to guess the boundary.

### Lifecycle

| State | Access |
|---|---|
| `active` / `trialing`, period valid | Pro |
| `active`, period ended | free (missed webhook — clock wins) |
| `canceled`, period not yet over | Pro, flagged "ending soon" |
| `canceled`, period over | free |
| `past_due`, within 7-day grace | Pro, flagged in-grace |
| `past_due`, grace expired | free |
| `past_due`, no period end | free (no window to measure) |

Grace exists so a failed card does not lock a paying customer out of their own
portfolio the same hour it fails. Dunning happens in that window.

Rules: unknown symbol → `404` with `{ error }`; bad input → `400`; known ticker
whose data cannot support a DCF → `422` (the request was fine, the data is not);
the shape a Flutter DTO generates against is the shape the web page renders,
always.

---

## 11. Ops

### Who runs the pipeline

| Trigger | Runs | Why there |
|---|---|---|
| GitHub Actions `nightly ingest` | the full universe, `npm run ingest` per stage | thousands of rate-limited vendor calls take far longer than any serverless timeout |
| Vercel cron `/api/cron/ingest` | bounded slices (`limit`, `symbols`) | top-ups and small universes, without a second deployment target |
| Vercel cron `/api/cron/health` | nothing — it only reads | an ingest that is killed mid-run cannot report itself |

Both trigger paths call the same `runStages` in `src/lib/ingest/pipeline.ts`, so a
hand-run backfill writes the same `ingest_runs` history as the schedule. If they
diverged, the dashboard would describe a pipeline nobody actually runs.

### Freshness policy (`src/lib/ops/policy.ts`)

Every stage declares how stale is too stale and what a user sees while it is —
`quotes` at 36h is critical because every price and margin of safety on the site
is wrong; `universe` at 10 days is a warning because only new listings are
missing. Overall verdict: any critical stage in trouble → `down`, warning-only →
`degraded`.

`partial` counts as a success for freshness. Some tickers fail every night —
delistings, missing cash flow statements — and paging on that trains everyone to
ignore alerts, which is how the real outage gets missed.

### How a failure becomes visible

1. `withRun` writes a row per run, including the failed and partial ones.
2. `/api/cron/health` assesses every stage hourly and returns **503** when a
   critical stage is broken, so a plain uptime check on that URL is enough.
3. It pushes a Telegram message naming the stage, the state, the user-visible
   impact and one example error.
4. `/ops` shows the same assessment plus the run log — admin-only, `notFound()`
   for everyone else.

Alert discipline: one message per distinct problem set, 6h cooldown, dedupe state
in `ops_alerts` because a serverless function has no memory between checks. A
worsening state changes the fingerprint, so `stale` → `failed` re-alerts instead
of being swallowed. Recovery is announced once — otherwise the only recovery
signal is silence, which is indistinguishable from a dead alerter. A failed send
writes no dedupe row, so it retries next check.

### Access

`/api/cron/*` needs `Authorization: Bearer $CRON_SECRET` (what Vercel Cron sends).
Unset secret → **503**, never open: those endpoints can burn vendor quota and
rewrite every row. `/ops` needs `users.role = 'admin'`; no such row means nobody.
