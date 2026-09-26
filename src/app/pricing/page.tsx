import Link from 'next/link'
import { CheckoutButton } from '@/components/checkout-button'
import { getCurrentUserAndEntitlement } from '@/lib/queries/billing'
import { FREE_LIMITS, PRO_LIMITS } from '@/lib/billing/entitlements'

export const metadata = { title: 'Pricing | finlens' }

const ROWS: Array<{ label: string; free: string; pro: string }> = [
  { label: 'Company search and profiles', free: 'Yes', pro: 'Yes' },
  {
    label: 'Financial history',
    free: `${FREE_LIMITS.financialYears} years`,
    pro: `${PRO_LIMITS.financialYears} years`,
  },
  { label: 'DCF fair value', free: 'Yes', pro: 'Yes' },
  {
    label: 'Editable assumptions, sensitivity grid, reverse DCF',
    free: 'No',
    pro: 'Yes',
  },
  {
    label: 'Compare companies',
    free: `${FREE_LIMITS.compareSymbols} at a time`,
    pro: `${PRO_LIMITS.compareSymbols} at a time`,
  },
  {
    label: 'Watchlist',
    free: `${FREE_LIMITS.watchlistSize} companies`,
    pro: 'Unlimited',
  },
  { label: 'Portfolio tracking', free: 'No', pro: 'Yes' },
  { label: 'Price history', free: '1 year', pro: 'Full history' },
]

export default async function PricingPage() {
  const { userId, entitlement } = await getCurrentUserAndEntitlement()

  return (
    <div className="space-y-10">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">One plan. Five dollars.</h1>
        <p className="text-zinc-500">
          The free tier is a real product, not a demo — search, fundamentals and a fair value on
          every company we cover. Pro adds depth, history and your own portfolio.
        </p>
      </div>

      {entitlement.isPro && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          You are on Pro
          {entitlement.accessUntil && ` until ${entitlement.accessUntil.toISOString().slice(0, 10)}`}
          {entitlement.inGracePeriod &&
            ' — your last payment failed. Update your payment method to avoid losing access.'}
          {entitlement.endingSoon && !entitlement.inGracePeriod && ' — cancels at period end.'}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <PlanCard
          name="Free"
          price="$0"
          cadence="forever"
          current={!entitlement.isPro}
          points={[
            'Search every covered company',
            `${FREE_LIMITS.financialYears} years of financials`,
            'DCF fair value and margin of safety',
            `Watchlist up to ${FREE_LIMITS.watchlistSize} companies`,
          ]}
        />
        <PlanCard
          name="Pro"
          price="$5"
          cadence="per month, or $50 a year"
          highlight
          current={entitlement.isPro}
          points={[
            `${PRO_LIMITS.financialYears} years of financials`,
            'Editable DCF assumptions and sensitivity analysis',
            'Portfolio tracking with derived cost basis',
            'Unlimited watchlist',
          ]}
          action={
            entitlement.isPro ? null : userId ? (
              <div className="space-y-2">
                <CheckoutButton plan="pro_monthly" label="Subscribe — $5 / month" />
                <CheckoutButton plan="pro_annual" label="Subscribe — $50 / year" />
              </div>
            ) : (
              <Link
                href="/signin"
                className="block rounded-xl bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Create an account
              </Link>
            )
          }
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 font-medium">Free</th>
              <th className="px-4 py-3 font-medium">Pro</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="px-4 py-2.5">{row.label}</td>
                <td className="px-4 py-2.5 text-zinc-500">{row.free}</td>
                <td className="px-4 py-2.5">{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400">
        Cancel any time — access continues to the end of the period you have already paid for.
        Not financial advice.
      </p>
    </div>
  )
}

function PlanCard({
  name,
  price,
  cadence,
  points,
  highlight = false,
  current = false,
  action,
}: {
  name: string
  price: string
  cadence: string
  points: string[]
  highlight?: boolean
  current?: boolean
  action?: React.ReactNode
}) {
  return (
    <div
      className={`space-y-4 rounded-xl border p-6 ${
        highlight
          ? 'border-zinc-900 dark:border-zinc-100'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{name}</h2>
        {current && (
          <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700">
            Current plan
          </span>
        )}
      </div>

      <div>
        <span className="font-mono text-3xl font-semibold">{price}</span>
        <span className="ml-2 text-sm text-zinc-500">{cadence}</span>
      </div>

      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
        {points.map((point) => (
          <li key={point}>· {point}</li>
        ))}
      </ul>

      {action}
    </div>
  )
}
