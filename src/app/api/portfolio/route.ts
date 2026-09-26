import type { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { getOrCreateDefaultPortfolio, getPortfolioDetail, listPortfolios } from '@/lib/queries/user'
import { addTransaction, deleteTransaction } from '@/app/actions/portfolio'
import { getEntitlementForUser } from '@/lib/queries/billing'
import { UPGRADE_MESSAGE } from '@/lib/billing/entitlements'

/**
 * Portfolio for API clients.
 *
 * Positions are derived server-side from the trade log and returned already
 * computed — the mobile client renders them, it does not recompute them. Two
 * implementations of cost-basis math would produce two different portfolios.
 */

/**
 * Actions return one flat message for auth, payment and validation failures.
 * Map it back to the right status here so API clients can branch on the code:
 * 401 means "sign in", 402 means "upgrade", and only the rest is a bad request.
 */
async function failureResponse(error: string, fallbackStatus: number): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error }, { status: 401 })

  if (error === UPGRADE_MESSAGE) {
    return Response.json({ error, upgrade: '/pricing' }, { status: 402 })
  }

  return Response.json({ error }, { status: fallbackStatus })
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  // 402 rather than 403: the request is legitimate and the identity is known —
  // what is missing is payment.
  const entitlement = await getEntitlementForUser(session.user.id)
  if (!entitlement.limits.portfolio) {
    return Response.json(
      { error: 'Portfolio tracking is a Pro feature.', upgrade: '/pricing' },
      { status: 402 },
    )
  }

  const { searchParams } = new URL(request.url)
  const idParam = searchParams.get('portfolioId')

  const portfolioId = idParam ?? (await getOrCreateDefaultPortfolio(session.user.id)).id

  const detail = await getPortfolioDetail(session.user.id, portfolioId)
  // getPortfolioDetail scopes by userId, so "not yours" and "does not exist"
  // both land here as 404 — no way to probe for other users' portfolio ids.
  if (!detail) return Response.json({ error: 'Portfolio not found' }, { status: 404 })

  const portfolios = await listPortfolios(session.user.id)

  return Response.json({
    portfolios,
    portfolio: detail.portfolio,
    summary: detail.summary,
    transactions: detail.transactions,
  })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body must be valid JSON' }, { status: 400 })
  }

  const result = await addTransaction(body)
  if (!result.ok) return failureResponse(result.error, 400)

  return Response.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('transactionId')

  if (!id) {
    return Response.json({ error: 'transactionId is required' }, { status: 400 })
  }

  // portfolioId is optional for clients that only ever use the default one.
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  // Read-only lookup: a DELETE must never create a portfolio as a side effect.
  const portfolioId =
    searchParams.get('portfolioId') ?? (await listPortfolios(session.user.id))[0]?.id ?? 'default'

  const result = await deleteTransaction({ portfolioId, id })
  if (!result.ok) return failureResponse(result.error, 404)

  return Response.json({ ok: true })
}
