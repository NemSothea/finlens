import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'
import { promisify } from 'node:util'

// promisify resolves to scrypt's 3-argument overload and drops the options
// parameter, so the cost parameters below would be silently ignored. Assert the
// 4-argument signature explicitly.
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>

/**
 * Password hashing with scrypt.
 *
 * scrypt rather than bcrypt/argon2 because it ships in Node's standard library:
 * no native module to compile, nothing to break on a Vercel build or an Alpine
 * container. It is a memory-hard KDF and is an accepted choice for password
 * storage (RFC 7914, OWASP-listed).
 *
 * Parameters are stored inside the hash string so they can be raised later
 * without invalidating existing credentials — on the next successful login the
 * caller can transparently re-hash with stronger settings.
 */

/** OWASP-recommended floor for scrypt: N=2^15, r=8, p=1 (~32 MB per hash). */
const N = 32_768
const R = 8
const P = 1
const KEY_LENGTH = 64
const SALT_LENGTH = 16

/** scrypt needs maxmem above roughly 128 * N * r, or it throws. */
const MAX_MEM = 192 * N * R

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const salt = randomBytes(SALT_LENGTH)
  const derived = (await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEM,
  })) as Buffer

  return ['scrypt', N, R, P, salt.toString('hex'), derived.toString('hex')].join('$')
}

/**
 * Constant-time verification.
 *
 * Returns false for malformed stored hashes rather than throwing: a corrupt row
 * must fail the login, not crash the auth route and leak a stack trace.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$')
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false

    const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts
    const n = Number(nRaw)
    const r = Number(rRaw)
    const p = Number(pRaw)

    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false

    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    if (salt.length === 0 || expected.length === 0) return false

    const derived = (await scrypt(password.normalize('NFKC'), salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: Math.max(MAX_MEM, 192 * n * r),
    })) as Buffer

    // timingSafeEqual throws on length mismatch, so guard first.
    if (derived.length !== expected.length) return false
    return timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

/** True when a stored hash used weaker parameters than the current policy and
 *  should be upgraded on next successful login. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return true
  return Number(parts[1]) < N || Number(parts[2]) < R || Number(parts[3]) < P
}
