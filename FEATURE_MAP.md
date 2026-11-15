# FEATURE_MAP — finlens vs finempowr (phase 1 research)

Date: 2026-11-11. Status: research only, no app code changed.

## Sources and limits

- finempowr app pages (`/login` and everything after) need an account. I did not log in.
  Evidence comes from the public landing page and its product screenshots:
  `landing/features/stock-detail.png`, `feature-compare.png`, `intinsic-val.png`, `landing/shot-price.png`.
  These show NVDA as of about July 2026. I could not see AAPL or MSFT on finempowr.
- finlens numbers below come from running finlens's own `FixtureProvider` and `deriveMetrics`.
  The local app could not be started: `node_modules` is empty and the `firebase` CLI is not installed.

## Root cause: why finlens numbers look wrong

| # | Cause | Evidence | Impact |
|---|---|---|---|
| 1 | **All data is synthetic.** `FMP_API_KEY` is empty in `.env.local`, so ingest uses `--provider=fixture`. | `src/lib/providers/fixture.ts`: values are a hash of the ticker. Its profile text says "Synthetic fixture profile… Not real data." | Every number is fake. Fixture output: AAPL sector "Consumer Staples", price $71.44. MSFT sector "Financials". NVDA sector "Healthcare", market cap $1.08T (finempowr shows $5.11T). |
| 2 | **The live provider would also fail.** `fmp.ts` calls `https://financialmodelingprep.com/api/v3/...`. FMP shut legacy v3 off for new subscriptions (about Aug 2025). Only `/stable/` works, and its paths, query params and field names differ (e.g. `?symbol=AAPL` instead of `/AAPL`). | `src/lib/providers/fmp.ts:13`. FMP changelog and migration note. | Adding a key alone does not fix anything. The provider has to be migrated to `/stable/`. |
| 3 | **No quarterly data is ingested.** `stageFinancials` only calls `getAnnualFinancials`. | `src/lib/ingest/stages.ts:143-180` | No TTM figures and no quarterly charts are possible. finempowr defaults to Quarterly (TTM). |
| 4 | **Fixture quarterly rows are internally inconsistent.** `getQuarterlyFinancials` scales only revenue, net income, operating cash flow and FCF by 0.25. Gross profit, operating income, EBITDA and the balance sheet stay at annual size. | `fixture.ts:157-176` | Once TTM is built, fixture margins would be about 4× too high. The fixture must be fixed before TTM can be tested. |
| 5 | **The DCF's net debt ignores short-term investments.** `netDebt = totalDebt − cashAndEquivalents`. | `src/lib/valuation/inputs.ts:104` | Understates fair value for cash-rich companies (AAPL, GOOGL, MSFT hold large marketable securities). |
| 6 | **Metrics use the latest fiscal year, not TTM.** ROE uses year-end equity. | `src/lib/queries/stocks.ts:202-226`, `src/lib/metrics.ts` | Numbers can be up to 12 months stale relative to finempowr. |

### finempowr's own inconsistencies (do NOT copy)

- Balance sheet card for NVDA: Cash $63B, Debt $11B, "Net $807M". 63 − 11 ≠ 0.807. The label's meaning is unclear.
- Intrinsic page: "39.60% upside" uses the current price of $210.96, but "Valuation comparison" uses the last close of $202.78 on the same screen.
- "LDC 75.27%" (Key Ratio card) is undefined and is not a standard NVDA ratio. Skip it unless the definition is known.
- Compare chart puts NVDA fiscal quarters (FY ends in January, labelled "Q1/2027") next to GOOGL calendar quarters, so the bars are misaligned in time.

**Therefore the phase-1 "within 1% of finempowr" target is the wrong yardstick.** Proposed target: within 1% of the FMP `/stable/` statements, cross-checked against the 10-K/10-Q for 3 tickers.

## Stock detail page

| Section | Metrics shown (finempowr) | Formula / method | finlens has it? | finlens file |
|---|---|---|---|---|
| Header | Logo, name, ticker, price, $ and % day change, Favorite, Add to portfolio | quote | partial: no logo, no $ change, no "add to portfolio" button | `stocks/[symbol]/page.tsx` |
| Header facts | Market cap, sector, exchange, **next earnings date** | earnings calendar endpoint | partial: no earnings date | same |
| Key margin | Gross, operating, net profit margin | TTM line ÷ TTM revenue | partial: FY only | `lib/metrics.ts` |
| Key ratio | ROE, **ROIC**, "LDC" (undefined) | ROE = TTM NI ÷ equity. ROIC = NOPAT ÷ (debt + equity − cash) | partial: ROE only (FY). No ROIC | `lib/metrics.ts` |
| Balance sheet | Cash, debt, net | cash (+ short-term investments?), total debt | partial: net debt exists, uses cash only | `lib/metrics.ts` |
| Share price return | YTD, 1Y, 5Y | price change. Chart badges are CAGR (5Y "+58.13%" = annualised of +888.69%) | no | needs `getPriceSeries` + adj close |
| Period toggle | Quarterly / Quarterly (TTM) / Annually | rolling 4-quarter sum for flows, latest for balances | no: annual only | needs quarterly ingest |
| Range toggle | MAX / 10Y / 5Y / 2Y / 1Y | slice series | no | — |
| Chart grid (small multiples, each expandable) | Share price, revenue, EBITDA, net income, EPS, operating cash flow (more below the fold, not visible) | bar per period | partial: 2 combined charts (financials, cash flow), FY only | `components/financials-chart.tsx` |
| Price modal | 1W, 1M, 3M, 6M, YTD, 1Y, 2Y, 5Y, 10Y, MAX, hover tooltip, return chips | — | partial: fixed 1–2 year range | `components/price-chart.tsx` |
| Intrinsic value | See next table | | partial | `components/dcf-panel.tsx` |
| Statements table | (not visible) | | yes: FY table | page.tsx |
| Valuation multiples (P/E, P/S, EV/EBITDA, P/FCF) | not visible in screenshots | | partial: P/E only | — |
| Dividends, ownership | not visible | | no | — |

## Intrinsic value

| Item | finempowr | finlens |
|---|---|---|
| Base cash flow | FCF **TTM** | FCF 3-year FY average |
| Model | **3-stage, 20 years**: growth 1–5y, 6–10y, 11–20y | 2-stage, 10 years, linear fade to 2.5% terminal |
| Flavours | **FCFF vs FCFE** toggle. FCFE adds net debt issuance − repayment and after-tax interest | single FCF |
| Discount rate | **WACC built from beta + cost of equity**, tax rate, interest expense | flat 10% default, user-editable |
| Outputs | intrinsic value, upside %, discount %, "other method" value, bar vs current price | fair value, margin of safety, reverse-DCF implied growth, sensitivity grid, year-by-year table |
| Analyst price target range (1Y min/avg/max) | yes | no (needs FMP price-target endpoint, plan-dependent) |

finlens is already stronger on transparency (sensitivity grid, reverse DCF). Gaps: TTM base, a 3-stage option, WACC derivation, FCFE, analyst targets.

## Compare page

| Item | finempowr | finlens |
|---|---|---|
| Symbol pick | chips with colour, ×, "Add stock" | `?symbols=A,B` URL only, up to 4 |
| Metric pick | chips "Share Price", "Revenue", "+ Add Matrix" | fixed list |
| Visual | **one overlay chart**: bars for the flow metric, line for price, dual axis | **table only** |
| Period / range | Quarterly / TTM / Annual. MAX…1Y | latest FY only |
| Winner per metric | not visible in screenshots | none |
| Table of ratios | not visible | yes: market, valuation, profitability, growth, balance sheet |

Proposed method: keep the table and add per-row "better" highlighting with an explicit rule (higher is better for margins, ROE, ROIC, growth and margin of safety; lower is better for P/E, debt/equity and net debt). Add the overlay chart, with series aligned by **period-end date**, not fiscal label.

## Blockers and decisions needed (phase 2)

1. **Real data needs an FMP key and plan.** The free tier is limited, and some endpoints used here (quarterly statements, price targets, earnings calendar) may be paid only. Check FMP pricing. Set `FMP_API_KEY` in `.env.local` yourself, never in code.
2. **Migrate `fmp.ts` from `/api/v3` to `/stable/`.** Verify each endpoint's field names against a live response before trusting them.
3. **Local run needs `npm install`** (node_modules is empty) and the firebase CLI (`npm i -g firebase-tools`, or add it as a dev dependency).
4. **Add a quarterly ingest stage** and a TTM roll-up, and fix the fixture's quarterly rows.

## Verification after FMP `/stable/` migration (2026-11-11)

`fmp.ts` now calls `/stable/`. AAPL, MSFT and NVDA were ingested on the free plan (22 vendor calls).
Latest-FY figures in finlens, compared with SEC EDGAR 10-K XBRL facts:

| Ticker | FY end | Fields checked | Result |
|---|---|---|---|
| AAPL | 2026-09-26 | revenue, gross profit, operating income, net income, EPS diluted, total assets, equity, cash, operating cash flow | 9/9 exact |
| MSFT | 2026-06-30 | same | 9/9 exact |
| NVDA | 2026-01-25 | same | 9/9 exact |

Findings from live data:
- finempowr's NVDA "Net $807M" equals finlens's `totalDebt − cashAndEquivalents` ($807M). Their "Cash $63B" line is cash plus short-term investments, so the card mixes two definitions of cash.
- finempowr's NVDA margins (gross 74.15%) are TTM. finlens shows FY2026 (gross 71.07%). TTM is still needed.
- Free plan limits: `limit` ≤ 5 periods; `batch-quote` and `stock-list` return 402 (per-symbol quote fallback added); no dividend-adjusted closes.
- With only 5 annual rows, "5y CAGR" is really a 4-year CAGR. The label or the data depth must change.
- `/stable/quote` has no P/E or share count. Shares = marketCap ÷ price. P/E now shows "—" until it is computed from TTM EPS.
- The DCF default (8% growth) gives NVDA $43.55 against a $171.65 price. That is a methodology default, not a data error. finempowr uses 41% for years 1–5.
- The other 7 tickers in the local emulator are still fixture (fake) data.

## Data fixes (2026-11-11, phase 2 step 1)

- Quarterly statements are now ingested (`--quarters`, `INGEST_QUARTERS`, default 8; FMP free plan max 5).
- **TTM** (`trailingTwelveMonths`): flows summed over 4 consecutive quarters, balances from the newest quarter. It is used only when it is at least as recent as the latest 10-K, otherwise the metrics fall back to FY. The basis is shown on the page.
- **Net debt** = total debt − (cash + short-term investments). The same definition is used on the metrics card, the compare page, the page DCF and the nightly DCF.
- New: ROIC, P/E (price ÷ TTM diluted EPS; null on losses), YTD/1Y/5Y price returns plus the 5Y CAGR (null when history is too short).
- CAGR is measured over actual fiscal years (`growthYears`), and labels show the real span (e.g. "4y").
- Fixture quarters now sum exactly to the annual statements.

TTM margins checked against SEC 10-K/10-Q (annual + current YTD − prior YTD):

| Ticker | TTM to | Gross / operating / net margin vs SEC |
|---|---|---|
| AAPL | 2026-09-26 | exact |
| MSFT | 2026-09-30 | exact |
| NVDA | 2026-07-26 | exact (Q3 FY27 not filed yet) |

## Stock page redesign (2026-11-11, phase 2 step 2)

- Header: name, ticker, price, $ and % day change, market cap, sector, exchange, **next earnings date** (FMP `/earnings`, one call per symbol in the profiles stage; stored as the optional `companies.nextEarningsDate`).
- Five cards: key margins, key ratios (P/E, ROE, ROIC, D/E), balance sheet (cash & ST inv., debt, net debt, current ratio), growth (span shown), share price return (YTD, 1Y, 5Y, 5Y annualised). Each card states its period.
- Fundamental overview grid: Quarterly / TTM / Annual, ranges 1Y–MAX, small multiples (price, revenue, EBITDA, net income, EPS, operating cash flow, FCF, net margin), and per-tile expand. One measure per tile, no dual axis, losses in rose.
- The price badge names the span it actually covers (a free plan shows "1Y" even when 5Y is selected).
- Removed from the page: the old dual-axis financials chart, the cash-flow chart and the separate price chart (`financials-chart.tsx` and `price-chart.tsx` are still on disk, unused by this page).
- Checked: NVDA total debt $38.86B = $33.37B long-term debt (SEC 10-Q, new borrowing in Jul 2026) + $5.49B leases. NVDA Q2 FY27 revenue $96.22B matches the reported figure.
- Not built: company logo, "Add to portfolio" button, analyst price targets.

## Compare page (2026-11-11, phase 2 step 3)

- Picker: chips with a colour dot and ×, plus a "+ Add stock" typeahead (`/api/stocks/search`). The URL `?symbols=A,B` is the source of truth and the plan limit is applied server side.
- Table: every row with a rule shows ↑/↓ better (hover for the reason). The winning cell gets ✓, bold and a tint. Ties and missing values get no mark. The header shows "Better on N of M" and each company's basis (TTM/FY). Price, market cap, fair value per share, margin of safety and price returns are context only (margin of safety stays unscored until the DCF derives growth per company).
- Charts: metric chips (share price, revenue, EBITDA, net income, EPS, OCF, FCF, net margin), Quarterly/TTM/Annual and 1Y–MAX. Share price is **indexed to 100** (no dual axis). Fundamentals are grouped bars **aligned by the calendar period holding each fiscal period's midpoint** (NVDA FY2026 → CY2025), which fixes the misalignment seen in finempowr's compare chart.
- Colours: fixed categorical slots `--series-1..4` (light + dark), validated for colour-blind separation. The light-mode contrast WARN on slots 3–4 is covered by the legend, chips and table.
- Fixed during the live check: an unreadable tooltip in dark mode; a false "Not in our universe" with one symbol; the search box staying open after an add.
