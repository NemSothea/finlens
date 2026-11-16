'use client'

import { useSyncExternalStore } from 'react'

/**
 * True when the user asked the OS for less motion. Recharts animates in
 * JavaScript, so the CSS `prefers-reduced-motion` rule in globals.css cannot
 * reach it — chart components read this instead.
 */
const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    // Server render: assume motion is fine; the client corrects on hydrate.
    () => false,
  )
}

/** Shared chart entrance timing — long enough to read as growth, short enough not to wait on. */
export const CHART_ANIMATION_MS = 550
