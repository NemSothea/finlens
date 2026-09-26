import { ManualProvider } from './manual'
import { PaywayProvider } from './payway'
import { PaymentConfigError, type PaymentProvider } from './types'

/**
 * Provider lookup.
 *
 * Constructed per call rather than cached at module load so a missing
 * environment variable surfaces as a handled error on the request that needs
 * it, instead of crashing the whole server at import time.
 */

export const SUPPORTED_PROVIDERS = ['payway', 'manual'] as const
export type ProviderName = (typeof SUPPORTED_PROVIDERS)[number]

export function isSupportedProvider(name: string): name is ProviderName {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(name)
}

export function getPaymentProvider(name: string): PaymentProvider {
  switch (name) {
    case 'payway':
      return new PaywayProvider()
    case 'manual':
      return new ManualProvider()
    default:
      throw new PaymentConfigError(`Unknown payment provider: ${name}`)
  }
}

/** The provider checkout should use. Defaults to manual so a fresh clone can
 *  exercise the flow before merchant credentials exist. */
export function getActiveProviderName(): ProviderName {
  const configured = process.env.PAYMENTS_PROVIDER ?? 'manual'
  return isSupportedProvider(configured) ? configured : 'manual'
}
