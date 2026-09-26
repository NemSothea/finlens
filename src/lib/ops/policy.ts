/**
 * What "healthy" means for each pipeline stage.
 *
 * The gate for this phase is that a failed nightly run is visible without
 * reading logs, and that needs an explicit expectation per stage: how often it
 * is supposed to run, and how long a gap is allowed before the data on the page
 * is wrong rather than merely a bit old.
 *
 * Severity is about the product, not the pipeline. Stale `quotes` change every
 * price, market cap and margin of safety the app shows, so that is critical.
 * Stale `universe` only means newly listed tickers are missing — annoying,
 * not wrong.
 */

export type StageName = 'universe' | 'profiles' | 'financials' | 'quotes' | 'prices' | 'valuations'

export type Severity = 'critical' | 'warning'

export interface StagePolicy {
  stage: StageName
  /** Human description, rendered on the dashboard next to the stage. */
  cadence: string
  /**
   * Hours since the last *successful* run before the stage counts as stale.
   *
   * Deliberately larger than the cadence: a daily stage that is 25 hours old is
   * a clock skew or a slow run, not an outage. Alerting on the first missed
   * minute trains everyone to ignore the alerts.
   */
  stalenessHours: number
  severity: Severity
  /** What breaks for a user while this stage is stale. Shown in the alert. */
  impact: string
}

export const STAGE_POLICIES: Record<StageName, StagePolicy> = {
  universe: {
    stage: 'universe',
    cadence: 'weekly',
    stalenessHours: 24 * 10,
    severity: 'warning',
    impact: 'newly listed tickers are missing from search',
  },
  profiles: {
    stage: 'profiles',
    cadence: 'weekly',
    stalenessHours: 24 * 10,
    severity: 'warning',
    impact: 'sector, exchange and company descriptions drift',
  },
  financials: {
    stage: 'financials',
    cadence: 'daily (earnings land continuously)',
    stalenessHours: 24 * 3,
    severity: 'critical',
    impact: 'the latest reported quarter is missing, so every valuation is built on old fundamentals',
  },
  quotes: {
    stage: 'quotes',
    cadence: 'daily after close',
    stalenessHours: 36,
    severity: 'critical',
    impact: 'prices, market caps and every margin of safety are out of date',
  },
  prices: {
    stage: 'prices',
    cadence: 'daily after close',
    stalenessHours: 36,
    severity: 'critical',
    impact: 'price charts stop short of today',
  },
  valuations: {
    stage: 'valuations',
    cadence: 'daily, after financials and quotes',
    stalenessHours: 36,
    severity: 'critical',
    impact: 'cached fair values disagree with the interactive DCF on the page',
  },
}

export const STAGE_ORDER: StageName[] = [
  'universe',
  'profiles',
  'financials',
  'quotes',
  'prices',
  'valuations',
]

/**
 * A run left in `running` for longer than this is treated as dead.
 *
 * Nothing marks a crashed process as failed — `withRun` only writes the final
 * status if the process survives to write it. A hung or OOM-killed run would
 * otherwise sit in `running` forever and count as "not stale yet", which is the
 * exact failure the dashboard exists to catch.
 */
export const STUCK_RUN_HOURS = 6

/** Cron groups. Each is one scheduled trigger; stages run in the listed order. */
export const CRON_GROUPS = {
  daily: ['financials', 'quotes', 'prices', 'valuations'] as StageName[],
  weekly: ['universe', 'profiles'] as StageName[],
} as const

export type CronGroup = keyof typeof CRON_GROUPS

export function isCronGroup(value: string): value is CronGroup {
  return value in CRON_GROUPS
}
