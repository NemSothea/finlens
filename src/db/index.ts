import { createHash } from 'node:crypto'
import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore'

/**
 * Firebase Admin — the only way the app talks to Firestore and Firebase Auth.
 *
 * Every read and write goes through the server with admin credentials; the
 * browser never touches Firestore directly (`firestore.rules` denies all client
 * access). That keeps the rule from the Postgres days intact: ownership and
 * entitlement are enforced in server code, in one place, not spread across
 * security rules and three clients.
 *
 * Credentials, in order:
 *   1. Emulator (FIRESTORE_EMULATOR_HOST set) — no credentials at all.
 *   2. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY — service account in env,
 *      which is what Vercel needs.
 *   3. Application default credentials (GOOGLE_APPLICATION_CREDENTIALS, gcloud).
 */

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

function createApp(): App {
  if (!projectId) {
    throw new Error(
      'FIREBASE_PROJECT_ID is not set. Copy .env.example to .env.local and fill it in.',
    )
  }

  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    // Without these, the gRPC client probes the GCE metadata server while
    // resolving credentials and stalls on a network timeout at every cold
    // start. The emulator needs no credentials, so skip the probe.
    process.env.GCLOUD_PROJECT ??= projectId
    process.env.METADATA_SERVER_DETECTION ??= 'none'
    return initializeApp({ projectId })
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId })
  }

  return initializeApp({ credential: applicationDefault(), projectId })
}

/**
 * One app and one Firestore per process. firebase-admin throws on a second
 * `initializeApp` with the same name and on a second `settings()` call, and
 * this module can be evaluated more than once per process — dev hot-reload
 * re-runs it on every edit, and a production build loads it from several
 * route bundles in the same worker. So the cache is global in every
 * environment, not just in development.
 */
const globalForFirebase = globalThis as unknown as { __finlensDb?: Firestore }

const app = getApps()[0] ?? createApp()

function createDb(): Firestore {
  const firestore = getFirestore(app)
  // Optional fields arrive as `undefined` from zod and the vendor mappers.
  // Firestore rejects undefined outright; dropping them matches what a NULL
  // column meant before.
  firestore.settings({ ignoreUndefinedProperties: true })
  return firestore
}

export const db = (globalForFirebase.__finlensDb ??= createDb())

export const adminAuth = getAuth(app)

/**
 * Firestore document ids cannot contain `/` and are capped at 1,500 bytes.
 * Anything that comes from outside (a provider's event id, a callback's
 * reference) is hashed into a safe, fixed-length id rather than trusted as a
 * path segment.
 */
export function safeId(...parts: string[]): string {
  return createHash('sha256').update(parts.join('\u0000')).digest('hex')
}

/** Firestore hands back Timestamps; everything downstream expects Dates. */
export function toDate(value: unknown): Date | null {
  if (value == null) return null
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export { Timestamp }
