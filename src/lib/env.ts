import { config } from 'dotenv'

/**
 * Standalone scripts (ingest, drizzle-kit) do not go through Next.js, so they
 * do not get Next's env loading. Load the same files Next does, in the same
 * precedence order, so a value set once works in both the app and the CLI.
 *
 * `override: false` — the first file to define a key wins, and a real process
 * env var (CI, Vercel, cron) always beats a local file.
 */
export function loadEnv(): void {
  for (const path of ['.env.local', '.env']) {
    config({ path, override: false, quiet: true })
  }
}

loadEnv()
