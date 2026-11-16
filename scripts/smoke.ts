/**
 * End-to-end smoke test against a running local app.
 *
 *   npm run emulators                 # Firestore + Auth emulators
 *   npm run dev -- -p 3001            # the app
 *   npm run smoke                     # this
 *   npm run smoke -- --base=http://localhost:3000
 *
 * Exercises every page and API as four kinds of visitor — signed out, free,
 * Pro and admin — over real HTTP with real session cookies, and checks status
 * codes and key content. It makes NO market-data vendor calls: it never opens
 * an unloaded company. It needs AAPL, MSFT and NVDA loaded, e.g.
 *   npm run ingest -- --stage=all --symbols=AAPL,MSFT,NVDA --years=5 --quarters=5
 *
 * Local only. It refuses to run unless the Firebase emulators are configured
 * and the base URL is localhost: it creates its own accounts
 * (smoke-*@finlens.test) with a fresh random password each run, grants one of
 * them Pro, and cleans up the watchlist and portfolio entries it adds.
 */
import '@/lib/env'
import { randomBytes } from 'node:crypto'
import { adminAuth, db } from '@/db'
import { refs, type SubscriptionDoc, type UserDoc } from '@/db/schema'

/* ------------------------------------------------------------------ *
 * Setup
 * ------------------------------------------------------------------ */

const BASE = (
  process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length) ??
  process.env.SMOKE_BASE_URL ??
  'http://localhost:3001'
).replace(/\/$/, '')

const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST
const CRON_SECRET = process.env.CRON_SECRET
const PASSWORD = randomBytes(18).toString('base64url')

function refuseUnlessLocal() {
  const host = new URL(BASE).hostname
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(host)
  if (!local || !AUTH_EMULATOR || !process.env.FIRESTORE_EMULATOR_HOST) {
    console.error(
      'smoke: refusing to run. It creates accounts and grants Pro, so it only runs against\n' +
        'localhost with FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST set.',
    )
    process.exit(2)
  }
}

type Role = 'anon' | 'free' | 'pro' | 'admin'
const EMAIL: Record<Exclude<Role, 'anon'>, string> = {
  free: 'smoke-free@finlens.test',
  pro: 'smoke-pro@finlens.test',
  admin: 'smoke-admin@finlens.test',
}

async function upsertUser(email: string, role: 'user' | 'admin'): Promise<string> {
  const uid = await adminAuth
    .getUserByEmail(email)
    .then(async (u) => (await adminAuth.updateUser(u.uid, { password: PASSWORD })).uid)
    .catch(async () => (await adminAuth.createUser({ email, password: PASSWORD })).uid)
  await adminAuth.setCustomUserClaims(uid, { role })
  const doc: UserDoc = { email, name: null, image: null, role, createdAt: new Date() }
  await refs.user(uid).set(doc, { merge: true })
  return uid
}

async function setPlan(uid: string, pro: boolean) {
  if (!pro) {
    await refs.subscription(uid).delete()
    return
  }
  const doc: SubscriptionDoc = {
    plan: 'pro_monthly',
    status: 'active',
    provider: 'manual',
    providerRef: null,
    currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
    cancelAtPeriodEnd: false,
    updatedAt: new Date(),
  }
  await refs.subscription(uid).set(doc)
}

/** ID token from the Auth emulator, then a session cookie from the app. */
async function signIn(email: string): Promise<{ token: string; cookie: string }> {
  const res = await fetch(
    `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=smoke`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
    },
  )
  const { idToken } = (await res.json()) as { idToken: string }
  const session = await fetch(`${BASE}/api/auth/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  const cookie = /__session=([^;]+)/.exec(session.headers.get('set-cookie') ?? '')?.[1]
  if (!cookie) throw new Error(`no session cookie for ${email} (HTTP ${session.status})`)
  return { token: idToken, cookie }
}

/* ------------------------------------------------------------------ *
 * Checks
 * ------------------------------------------------------------------ */

const results: Array<{ ok: boolean; name: string; detail: string }> = []
const creds: Partial<Record<Role, { token: string; cookie: string }>> = {}

async function request(
  method: string,
  path: string,
  opts: { role?: Role; body?: unknown; bearer?: string; useCookie?: boolean } = {},
) {
  const c = opts.role ? creds[opts.role] : undefined
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  if (opts.bearer) headers.authorization = `Bearer ${opts.bearer}`
  else if (c && opts.useCookie) headers.cookie = `__session=${c.cookie}`
  else if (c) headers.authorization = `Bearer ${c.token}`
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    redirect: 'manual',
  })
  return { status: res.status, text: await res.text(), location: res.headers.get('location') }
}

async function page(role: Role, path: string, expect: number, must: string[] = [], mustNot: string[] = []) {
  const r = await request('GET', path, { role: role === 'anon' ? undefined : role, useCookie: true })
  const missing = [...must.filter((m) => !r.text.includes(m)), ...mustNot.filter((m) => r.text.includes(m)).map((m) => `!${m}`)]
  results.push({
    ok: r.status === expect && missing.length === 0,
    name: `page ${role.padEnd(5)} ${path}`,
    detail: `HTTP ${r.status}${r.location ? ` → ${r.location}` : ''}${missing.length ? ` missing ${JSON.stringify(missing)}` : ''}`,
  })
}

async function api(
  label: string,
  method: string,
  path: string,
  expect: number,
  opts: { role?: Role; body?: unknown; bearer?: string; must?: string[] } = {},
) {
  const r = await request(method, path, opts)
  const missing = (opts.must ?? []).filter((m) => !r.text.includes(m))
  results.push({
    ok: r.status === expect && missing.length === 0,
    name: `api  ${(opts.role ?? 'anon').padEnd(5)} ${method} ${label}`,
    detail: `HTTP ${r.status} ${r.text.slice(0, 160)}`,
  })
  return r
}

async function main() {
  refuseUnlessLocal()

  // Fail fast with a useful message when the prerequisites are missing.
  const ping = await fetch(`${BASE}/api/stocks/AAPL`).catch(() => null)
  if (!ping) {
    console.error(`smoke: nothing answering at ${BASE}. Start it with: npm run dev -- -p 3001`)
    process.exit(2)
  }
  if (ping.status === 404) {
    console.error('smoke: AAPL is not loaded. Seed: npm run ingest -- --stage=all --symbols=AAPL,MSFT,NVDA --years=5 --quarters=5')
    process.exit(2)
  }

  const freeUid = await upsertUser(EMAIL.free, 'user')
  const proUid = await upsertUser(EMAIL.pro, 'user')
  const adminUid = await upsertUser(EMAIL.admin, 'admin')
  await setPlan(freeUid, false)
  await setPlan(proUid, true)
  await setPlan(adminUid, false)
  // Start each run with an empty watchlist for the Pro account.
  for (const d of (await refs.watchlist(proUid).get()).docs) await d.ref.delete()

  for (const role of ['free', 'pro', 'admin'] as const) creds[role] = await signIn(EMAIL[role])

  /* ── Pages ─────────────────────────────────────────────────── */
  await page('anon', '/', 200, ['Popular companies', '>AAPL<'])
  await page('free', '/', 200, ['Popular companies'])
  await request('POST', '/api/watchlist', { role: 'pro', body: { symbol: 'NVDA' } })
  await page('pro', '/', 200, ['Your watchlist', '>NVDA<'], ['Popular companies'])
  await page('pro', '/watchlist', 200, ['NVDA'])

  await page('anon', '/stocks/AAPL', 200, ['Apple', 'Key margins', 'Fundamental overview', 'Intrinsic value'])
  await page('free', '/stocks/AAPL', 200, ['DCF fair value'], ['Starting cash flow'])
  await page('pro', '/stocks/AAPL', 200, ['Starting cash flow', 'Cash flow to', 'Annual statements'])
  await page('pro', '/stocks/aapl', 200, ['Apple'])
  await page('anon', '/stocks/ZZZZQQ', 404)

  await page('anon', '/compare?symbols=AAPL,MSFT', 200, ['Better on', 'Apple', 'Microsoft'])
  await page('pro', '/compare?symbols=AAPL,MSFT,NVDA', 200, ['NVIDIA'])
  await page('anon', '/compare', 200)

  await page('anon', '/watchlist', 307)
  await page('free', '/watchlist', 200)
  await page('anon', '/portfolio', 307)
  await page('free', '/portfolio', 200, ['Portfolio tracking is Pro'])
  await page('pro', '/portfolio', 200, ['Record a trade'], ['Portfolio tracking is Pro'])

  await page('anon', '/ops', 404)
  await page('free', '/ops', 404)
  await page('admin', '/ops', 200, ['valuations'])
  await page('anon', '/signin', 200, ['Sign in'])
  await page('anon', '/definitely-not-a-page', 404)
  if (process.env.NEXT_PUBLIC_PRICING_ENABLED !== 'true') await page('anon', '/pricing', 404)

  /* ── Public APIs ───────────────────────────────────────────── */
  await api('search', 'GET', '/api/stocks/search?q=apple&limit=5', 200, { must: ['"AAPL"'] })
  await api('search empty', 'GET', '/api/stocks/search?q=', 200, { must: ['"count":0'] })
  await api('search bad limit', 'GET', '/api/stocks/search?q=a&limit=x', 400)
  await api('stock', 'GET', '/api/stocks/AAPL', 200, { must: ['"symbol":"AAPL"'] })
  await api('stock unknown', 'GET', '/api/stocks/ZZZZQQ', 404)
  await api('financials FY', 'GET', '/api/stocks/AAPL/financials?period=FY&years=5', 200)
  await api('financials Q', 'GET', '/api/stocks/AAPL/financials?period=Q&years=2', 200)
  await api('prices', 'GET', '/api/stocks/AAPL/prices?days=30', 200)
  await api('compare', 'GET', '/api/compare?symbols=AAPL,MSFT', 200, { must: ['AAPL', 'MSFT'] })

  /* ── Gated APIs ────────────────────────────────────────────── */
  await api('valuation', 'POST', '/api/stocks/AAPL/valuation', 402, { body: {} })
  await api('valuation', 'POST', '/api/stocks/AAPL/valuation', 402, { role: 'free', body: {} })
  await api('valuation fcfe 3-stage', 'POST', '/api/stocks/AAPL/valuation', 200, {
    role: 'pro',
    body: { flavour: 'fcfe', growthYears: 5, transitionYears: 15 },
    must: ['"flavour":"fcfe"', 'fairValuePerShare'],
  })
  await api('valuation out of range', 'POST', '/api/stocks/AAPL/valuation', 400, { role: 'pro', body: { growthRate: 5 } })

  await api('watchlist', 'GET', '/api/watchlist', 401)
  await api('watchlist add', 'POST', '/api/watchlist', 201, { role: 'free', body: { symbol: 'MSFT' } })
  await api('watchlist list', 'GET', '/api/watchlist', 200, { role: 'free', must: ['MSFT'] })
  await api('watchlist remove', 'DELETE', '/api/watchlist?symbol=MSFT', 200, { role: 'free' })

  await api('portfolio', 'GET', '/api/portfolio', 401)
  await api('portfolio', 'GET', '/api/portfolio', 402, { role: 'free' })
  const p = await api('portfolio', 'GET', '/api/portfolio', 200, { role: 'pro' })
  const portfolioId: string | undefined =
    JSON.parse(p.text)?.portfolio?.id ?? JSON.parse(p.text)?.portfolioId ?? undefined
  if (portfolioId) {
    await api('portfolio add trade', 'POST', '/api/portfolio', 201, {
      role: 'pro',
      body: { portfolioId, symbol: 'AAPL', kind: 'buy', quantity: 2, pricePerShare: 300, tradedAt: '2026-01-02' },
    })
    const read = await api('portfolio read', 'GET', `/api/portfolio?portfolioId=${portfolioId}`, 200, { role: 'pro', must: ['AAPL'] })
    const tx = (JSON.parse(read.text).transactions ?? []).find(
      (t: { symbol: string; quantity: number }) => t.symbol === 'AAPL' && t.quantity === 2,
    )
    if (tx) {
      await api('portfolio delete trade', 'DELETE', `/api/portfolio?portfolioId=${portfolioId}&transactionId=${tx.id}`, 200, { role: 'pro' })
    } else {
      results.push({ ok: false, name: 'api  pro   portfolio delete trade', detail: 'added trade not found' })
    }
  } else {
    results.push({ ok: false, name: 'api  pro   portfolio id', detail: p.text.slice(0, 160) })
  }

  /* ── Ops ───────────────────────────────────────────────────── */
  await api('cron health without secret', 'GET', '/api/cron/health', 401)
  if (CRON_SECRET) {
    await api('cron health', 'GET', '/api/cron/health', 200, { bearer: CRON_SECRET })
    // Valuations is pure compute — no vendor calls.
    await api('cron ingest valuations', 'GET', '/api/cron/ingest?stage=valuations&symbols=AAPL', 200, { bearer: CRON_SECRET })
  }
  await api('webhook forged', 'POST', '/api/payments/webhook/manual', 400, { body: {} })
  await api('webhook unknown provider', 'POST', '/api/payments/webhook/nope', 404, { body: {} })

  // Leave the Pro account as we found it.
  await request('DELETE', '/api/watchlist?symbol=NVDA', { role: 'pro' })
  await page('pro', '/', 200, ['Popular companies'])

  /* ── Report ────────────────────────────────────────────────── */
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : `  [${r.detail}]`}`)
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} passed${CRON_SECRET ? '' : ' (cron checks skipped: CRON_SECRET unset)'}`)
  await db.terminate()
  process.exit(failed ? 1 : 0)
}

main().catch(async (error) => {
  console.error(error)
  await db.terminate().catch(() => {})
  process.exit(1)
})
