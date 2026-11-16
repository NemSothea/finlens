import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
import { auth } from '@/auth'
import { signOutAction } from '@/app/actions/auth'
import './globals.css'
import { pricingEnabled } from '@/lib/billing/pricing'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'finlens — fundamentals-first stock research',
  description:
    'Company fundamentals from SEC filings, years of financial history and disciplined intrinsic-value estimates for long-term investors.',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const session = await auth()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header
          className="border-b border-zinc-200 dark:border-zinc-800"
          style={{ viewTransitionName: 'site-header' }}
        >
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="shrink-0 font-mono text-sm font-semibold tracking-tight">
              finlens
            </Link>
            {/* Scrolls sideways on a phone rather than pushing the page wider. */}
            <div className="-mr-1 flex min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap pr-1 text-sm text-zinc-500 [scrollbar-width:none] sm:gap-6">
              <Link href="/" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                Search
              </Link>
              <Link
                href="/compare?symbols=AAPL,MSFT"
                className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Compare
              </Link>
              {pricingEnabled() && (
                <Link
                  href="/pricing"
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Pricing
                </Link>
              )}

              {session?.user ? (
                <>
                  <Link
                    href="/watchlist"
                    className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Watchlist
                  </Link>
                  <Link
                    href="/portfolio"
                    className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Portfolio
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/signin"
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>

        <footer className="border-t border-zinc-200 px-6 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
          Data is ingested on a schedule and may be stale. Not financial advice.
        </footer>
      </body>
    </html>
  )
}
