import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SignInForm } from '@/components/signin-form'

export const metadata = {
  title: 'Sign in | finlens',
}

/** Only same-site paths — an absolute `next` would make this an open redirect. */
function safeNext(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/watchlist'
}

export default async function SignInPage({ searchParams }: PageProps<'/signin'>) {
  const next = safeNext((await searchParams).next)

  const session = await auth()
  if (session?.user) redirect(next)

  const googleEnabled =
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true' ||
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST)

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-zinc-500">
          A watchlist and portfolio are tied to an account. Everything else works signed out.
        </p>
      </div>

      <SignInForm googleEnabled={googleEnabled} next={next} />
    </div>
  )
}
