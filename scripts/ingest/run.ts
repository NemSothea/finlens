/**
 * Ingest CLI.
 *
 *   npm run ingest -- --stage=universe --limit=200
 *   npm run ingest -- --stage=profiles --symbols=AAPL,MSFT
 *   npm run ingest -- --stage=financials --symbols=AAPL --years=30 --quarters=8
 *   npm run ingest -- --stage=quotes
 *   npm run ingest -- --stage=valuations
 *   npm run ingest -- --stage=all --limit=50
 *
 * Stages are independent and idempotent — re-running one is always safe, which
 * is what makes cron scheduling and manual backfills the same operation. The
 * stage execution itself lives in `src/lib/ingest/pipeline.ts`, shared with the
 * cron endpoint, so both paths write identical `ingest_runs` history.
 */
import '@/lib/env'
import { ALL_ORDER, isStageName, runStages } from '@/lib/ingest/pipeline'
import type { StageName } from '@/lib/ops/policy'
import { db } from '@/db'

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {}
  for (const arg of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(arg)
    if (m) out[m[1]] = m[2]
    else if (arg.startsWith('--')) out[arg.slice(2)] = 'true'
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const stageArg = args.stage ?? 'all'

  const requested: StageName[] =
    stageArg === 'all' ? ALL_ORDER : isStageName(stageArg) ? [stageArg] : []

  if (requested.length === 0) {
    console.error(`Unknown stage "${stageArg}". Valid: ${[...ALL_ORDER, 'all'].join(', ')}`)
    process.exit(1)
  }

  const symbols = args.symbols
    ? args.symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : undefined

  await runStages({
    stages: requested,
    provider: args.provider,
    symbols,
    limit: args.limit ? Number(args.limit) : undefined,
    years: args.years ? Number(args.years) : undefined,
    quarters: args.quarters ? Number(args.quarters) : undefined,
    concurrency: args.concurrency ? Number(args.concurrency) : undefined,
    // A human watching a terminal wants the first failure to stop the run, not
    // five more stages of output on top of it.
    stopOnError: true,
  })
}

main()
  .then(async () => {
    await db.terminate()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error)
    await db.terminate().catch(() => {})
    process.exit(1)
  })
