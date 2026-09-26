import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SignInForm } from '@/components/signin-form'

export const metadata = {
  title: 'Sign in | finlens',
}

export default async function SignInPage() {
  const session = await auth()
  if (session?.user) redirect('/watchlist')

  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-zinc-500">
          A watchlist and portfolio are tied to an account. Everything else works signed out.
        </p>
      </div>

      <SignInForm googleConfigured={googleConfigured} />
    </div>
  )
}
