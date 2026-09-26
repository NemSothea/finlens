import { db } from '@/db'
import { ingestRuns } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redact } from '@/lib/providers/http'

export interface RunContext {
  runId: number
  ok: number
  failed: number
  vendorCalls: number
  errors: Array<{ item: string; message: string }>
  recordOk(n?: number): void
  recordFailure(item: string, error: unknown): void
  countVendorCall(): void
}

/**
 * Wraps a stage so that every run leaves a row in `ingest_runs` — including
 * crashed ones. A nightly pipeline that fails silently is the standard way
 * data products rot: the app keeps serving last week's numbers and nobody
 * notices until a user does.
 *
 * Partial failure is the expected outcome at scale, not an exception: some
 * tickers are delisted mid-run, some have no cash flow statement. The run
 * records them and continues.
 */
export async function withRun<T>(
  stage: string,
  fn: (ctx: RunContext) => Promise<T>,
): Promise<{ result?: T; ctx: RunContext }> {
  const [row] = await db
    .insert(ingestRuns)
    .values({ stage, status: 'running' })
    .returning({ id: ingestRuns.id })

  const ctx: RunContext = {
    runId: row.id,
    ok: 0,
    failed: 0,
    vendorCalls: 0,
    errors: [],
    recordOk(n = 1) {
      ctx.ok += n
    },
    recordFailure(item, error) {
      ctx.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      // Cap retained errors — a fully broken vendor would otherwise write a
      // multi-megabyte JSON blob into every run row.
      if (ctx.errors.length < 50) ctx.errors.push({ item, message: redact(message).slice(0, 500) })
    },
    countVendorCall() {
      ctx.vendorCalls += 1
    },
  }

  let result: T | undefined
  let fatal: unknown

  try {
    result = await fn(ctx)
  } catch (error) {
    fatal = error
    ctx.recordFailure('__stage__', error)
  }

  const status = fatal ? 'failed' : ctx.failed > 0 ? 'partial' : 'ok'

  await db
    .update(ingestRuns)
    .set({
      status,
      finishedAt: new Date(),
      itemsOk: ctx.ok,
      itemsFailed: ctx.failed,
      vendorCalls: ctx.vendorCalls,
      errors: ctx.errors.length ? ctx.errors : null,
    })
    .where(eq(ingestRuns.id, ctx.runId))

  console.log(
    `[${stage}] ${status} — ok=${ctx.ok} failed=${ctx.failed} vendorCalls=${ctx.vendorCalls}`,
  )
  if (ctx.errors.length) {
    for (const e of ctx.errors.slice(0, 10)) console.warn(`  ! ${e.item}: ${e.message}`)
    if (ctx.errors.length > 10) console.warn(`  ! …and ${ctx.errors.length - 10} more`)
  }

  if (fatal) throw fatal
  return { result, ctx }
}

/** Chunk helper — Postgres has a 65535 bind-parameter ceiling per statement,
 *  which a naive 2,000-row multi-column insert blows straight through. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}
