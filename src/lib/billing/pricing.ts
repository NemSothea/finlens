/**
 * Whether the Pricing page and checkout are switched on.
 *
 * Off by default: the Free/Pro limits still apply, but there is no public
 * plans page or checkout yet. Turning it on is one env var — no code change.
 * NEXT_PUBLIC_ so the same answer is available to client components.
 */
export function pricingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRICING_ENABLED === 'true'
}

/** Where an upgrade link should point, or null while pricing is hidden. */
export function upgradePath(): string | null {
  return pricingEnabled() ? '/pricing' : null
}
