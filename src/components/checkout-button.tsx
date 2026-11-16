'use client'

import { useRef, useState, useTransition } from 'react'
import { startCheckout } from '@/app/actions/checkout'
import type { PlanId } from '@/lib/payments/types'

/**
 * Starts a purchase and hands off to the provider.
 *
 * Two handoff shapes are supported because providers differ: a plain redirect,
 * or a form POST (PayWay needs the signed fields in the body, so a GET redirect
 * cannot carry them). The hidden form is built and submitted only after the
 * server has created the payment row.
 */
export function CheckoutButton({ plan, label }: { plan: PlanId; label: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function onClick() {
    setError(null)

    startTransition(async () => {
      const result = await startCheckout(plan)

      if (!result.ok) {
        setError(result.error)
        return
      }

      if (result.formAction && result.formFields) {
        const form = formRef.current
        if (!form) return

        form.action = result.formAction
        form.replaceChildren(
          ...Object.entries(result.formFields).map(([name, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = name
            input.value = value
            return input
          }),
        )
        form.submit()
        return
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="motion-press w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? 'Starting…' : label}
      </button>

      {error && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      {/* Populated and submitted by the handler above. */}
      <form ref={formRef} method="POST" className="hidden" />
    </div>
  )
}
