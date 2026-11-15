import { FmpProvider } from '@/lib/providers/fmp'
import { FixtureProvider } from '@/lib/providers/fixture'
import type { MarketDataProvider } from '@/lib/providers/types'
import { withRun } from './runner'
import {
  stageFinancials,
  stagePrices,
  stageProfiles,
  stageQuotes,
  stageUniverse,
  stageValuations,
  type StageOptions,
} from './stages'
import type { StageName } from '@/lib/ops/policy'

/**
 * One way to run stages, shared by the CLI and the cron endpoint.
 *
 * The scheduled path and the manual path must be the same code: a backfill I run
 * by hand has to produce the same rows and the same `ingest_runs` history as the
 * nightly trigger, or the dashboard describes a pipeline nobody actually runs.
 */

export const STAGE_FNS: Record<StageName, (o: StageOptions) => Promise<unknown>> = {
  universe: stageUniverse,
  profiles: stageProfiles,
  financials: stageFinancials,
  quotes: stageQuotes,
  prices: stagePrices,
  valuations: stageValuations,
}

// Order matters: profiles need the universe, valuations need financials + quotes.
export const ALL_ORDER: StageName[] = [
  'universe',
  'profiles',
  'financials',
  'quotes',
  'prices',
  'valuations',
]

export function isStageName(value: string): value is StageName {
  return value in STAGE_FNS
}

/**
 * `provider=fixture` runs the whole pipeline offline against deterministic
 * synthetic data. That keeps CI and first-time setup independent of a paid key
 * and of vendor uptime — the pipeline is testable before it is funded.
 */
export function makeProvider(
  name: string | undefined,
  onVendorCall: () => void,
): MarketDataProvider {
  switch (name ?? process.env.INGEST_PROVIDER ?? 'fmp') {
    case 'fixture':
      return new FixtureProvider()
    case 'fmp':
      return new FmpProvider({ onVendorCall })
    default:
      throw new Error(`Unknown provider "${name}". Valid: fmp, fixture`)
  }
}

export interface RunStagesOptions {
  stages: StageName[]
  provider?: string
  symbols?: string[]
  limit?: number
  years?: number
  quarters?: number
  concurrency?: number
  /** Stop at the first stage that throws. The CLI wants this; cron does not. */
  stopOnError?: boolean
}

export interface StageSummary {
  stage: StageName
  runId: string | null
  status: 'ok' | 'partial' | 'failed'
  ok: number
  failed: number
  vendorCalls: number
  /** Set when the stage itself threw, as opposed to individual symbols failing. */
  fatal?: string
}

export async function runStages(options: RunStagesOptions): Promise<StageSummary[]> {
  const summaries: StageSummary[] = []

  for (const stage of options.stages) {
    // `universe` reads from the vendor, not from our symbol list — passing an
    // explicit symbol list to it would silently shrink the covered universe.
    const stageSymbols = stage === 'universe' ? undefined : options.symbols

    let fatal: unknown

    const { ctx } = await withRun(stage, async (context) => {
      const provider = makeProvider(options.provider, () => context.countVendorCall())
      return STAGE_FNS[stage]({
        provider,
        ctx: context,
        symbols: stageSymbols,
        limit: options.limit,
        years: options.years,
        quarters: options.quarters,
        concurrency: options.concurrency,
      })
    }).catch((error) => {
      // `withRun` has already written the failed row and logged the error; it
      // rethrows so a CLI exits non-zero. Cron wants the remaining stages to
      // still run — one dead vendor endpoint should not skip the pure-compute
      // valuations stage.
      fatal = error
      return { ctx: null }
    })

    summaries.push({
      stage,
      runId: ctx?.runId ?? null,
      status: fatal ? 'failed' : (ctx?.failed ?? 0) > 0 ? 'partial' : 'ok',
      ok: ctx?.ok ?? 0,
      failed: ctx?.failed ?? 0,
      vendorCalls: ctx?.vendorCalls ?? 0,
      ...(fatal ? { fatal: fatal instanceof Error ? fatal.message : String(fatal) } : {}),
    })

    if (fatal && options.stopOnError) throw fatal
  }

  return summaries
}
