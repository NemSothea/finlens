import { NextResponse, type NextRequest } from 'next/server'
import { isProRoute } from '@/lib/billing/entitlements'

/**
 * Proxy (formerly `middleware.js`, renamed in Next 16).
 *
 * This is a FAST PATH, not the security boundary. It only checks whether a
 * session cookie exists, so a signed-out visitor is bounced before a page
 * renders and hits the database.
 *
 * It deliberately does NOT resolve entitlements:
 *
 * 1. Next's own docs warn that a matcher change or moving a Server Function to
 *    another route can silently remove proxy coverage. Anything that matters
 *    must therefore be re-checked in the handler.
 * 2. A cookie proves only that someone signed in once. Whether the token is
 *    valid, and whether that user is still paying, are database questions —
 *    and they are answered in the page, the Server Action and the route
 *    handler, every time.
 *
 * So: every gated page and endpoint re-checks entitlement itself. Deleting this
 * file would cost a redirect, not open the paywall.
 */

// Same name as SESSION_COOKIE in `@/auth` — not imported, because that module
// pulls in firebase-admin, which has no place on the proxy's fast path.
const SESSION_COOKIE = '__session'

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(SESSION_COOKIE)?.value)
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const needsAccount = pathname === '/watchlist' || isProRoute(pathname)
  if (!needsAccount) return NextResponse.next()

  if (hasSessionCookie(request)) return NextResponse.next()

  // Preserve where they were going so sign-in can return them there.
  const signInUrl = new URL('/signin', request.url)
  signInUrl.searchParams.set('next', `${pathname}${search}`)

  return NextResponse.redirect(signInUrl)
}

export const config = {
  // Only the routes that require an account. Everything else — the landing
  // page, company pages, the JSON API — stays untouched, so a proxy bug cannot
  // take down the public product.
  matcher: ['/watchlist', '/portfolio/:path*', '/portfolio'],
}
