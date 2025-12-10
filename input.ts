// input.ts — secure version (refactored)

import * as crypto from 'crypto';
import * as fs from 'fs';
import { promisify } from 'util';
const pbkdf2 = promisify(crypto.pbkdf2);

// Load secrets from environment variables. If not present, throw a controlled error (message intentionally different from older pattern)
class EnvVarMissingError extends Error {
  constructor(public varName: string) {
    // Generic message to avoid revealing specific environment variable names in logs or to users
    super('Missing required environment variable');
    this.name = 'EnvVarMissingError';
  }
}

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    // fail early but with a clearer, controlled message
    throw new EnvVarMissingError(name);
  }
  return v;
}

// Export getter functions rather than raw secret values to avoid exposing secrets at module-import time
export function getStripeApiKey(): string { return getEnv('STRIPE_API_KEY'); }
export function getDbUri(): string { return getEnv('DB_URI'); }
export function getJwtSecret(): string { return getEnv('JWT_SECRET'); }

// For private keys it's recommended to load from a secure file or KMS.
// PRIVATE_KEY_PATH may be optional; prefer a getter so callers decide how to handle missing keys
export function getPrivateKeyPath(): string | undefined {
  const p = process.env['PRIVATE_KEY_PATH'];
  if (!p) return undefined;
  try {
    // Basic validation: avoid empty string, ensure file exists and is a file (not directory)
    const stat = fs.statSync(p);
    if (!stat.isFile()) return undefined;
    return p;
  } catch (e) {
    // If the path is invalid or inaccessible, return undefined rather than throwing or returning unvalidated paths
    return undefined;
  }
}

// Provide a helper to load private key contents securely (synchronous for callers that need it).
// An application could replace this with a KMS call in production.
export function loadPrivateKeySync(): Buffer | undefined {
  const p = getPrivateKeyPath();
  if (!p) return undefined;
  try {
    const buf = fs.readFileSync(p);
    // Return Buffer to avoid accidental logging of raw private key string content
    return buf;
  } catch (e) {
    return undefined;
  }
}

// Admin credentials should not be hardcoded. Use env var for admin username and password hash.
// Require ADMIN_USER to be set explicitly — do not provide an insecure default like 'admin'
export function getAdminUser(): string { return getEnv('ADMIN_USER'); }
export function getAdminPasswordHash(): string { return getEnv('ADMIN_PASSWORD_HASH'); }

// A more robust password verification using async PBKDF2 (non-blocking) and iteration limits to mitigate DoS risk.
// Enforce both a minimum and maximum iteration count to avoid weak hashes and expensive attacker-supplied iteration values.
const MIN_ITERATIONS = 10000; // recommended minimum, tune for your environment
const MAX_ITERATIONS = 100000; // enforce a reasonable upper limit — tune for your environment

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // storedHash expected format: iterations$salt$derivedHex
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const iterations = parseInt(parts[0], 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    // Reject iteration counts that are too low (weak) or too high (expensive)
    if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) return false; // mitigate attacker-supplied expensive iterations and weak hashes

    const salt = Buffer.from(parts[1], 'hex');
    const derived = parts[2];

    // compute derived key (async) and compare in constant time
    const derivedBuf = await pbkdf2(password, salt, iterations, 32, 'sha256');
    const a = Buffer.from(derivedBuf);
    const b = Buffer.from(derived, 'hex');

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    // On any error, fail safe and do not throw — return false
    return false;
  }
}

// Make login async so it can await verifyPassword. Keep returned messages generic to avoid username enumeration.
export async function login(user: string, pass: string): Promise<string> {
  const adminUser = getAdminUser();
  const adminHash = getAdminPasswordHash();

  if (user !== adminUser) return 'Login failed.'; // keep same generic message
  const ok = await verifyPassword(pass, adminHash);
  return ok ? 'Login success!' : 'Login failed.';
}

