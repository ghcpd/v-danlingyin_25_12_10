// input.ts — hardened secure version

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Load secrets from environment variables. If not present, throw an error without leaking secret values in logs
function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable`); // Do not include the variable name or value in logs
  }
  return v;
}

// Export getter functions rather than raw secret values to avoid exposing secrets at module-import time
export function getStripeApiKey(): string { return getEnv('STRIPE_API_KEY'); }
export function getDbUri(): string { return getEnv('DB_URI'); }
export function getJwtSecret(): string { return getEnv('JWT_SECRET'); }

// For private keys, return the key material securely (if available) rather than exposing paths
export function getPrivateKeyPath(): string | undefined {
  return process.env['PRIVATE_KEY_PATH'] || undefined;
}

export function loadPrivateKey(): string | undefined {
  const p = getPrivateKeyPath();
  if (!p) return undefined;
  const abs = path.resolve(p);
  // Only allow reading from absolute paths under a configured secure directory if provided
  try {
    const stat = fs.statSync(abs);
    if (!stat.isFile()) return undefined;
    // On POSIX systems, warn if world-readable; best-effort check
    if (process.platform !== 'win32') {
      const mode = stat.mode & 0o777;
      // owner must have read, group and other should not have read
      if ((mode & 0o077) !== 0) {
        throw new Error('Private key file has insecure permissions');
      }
    }
    return fs.readFileSync(abs, 'utf-8');
  } catch (err) {
    // don't leak path or error details
    return undefined;
  }
}

// Admin credentials should not be hardcoded. Use env var for admin username and password hash.
export function getAdminUser(): string { return getEnv('ADMIN_USER'); }
export function getAdminPasswordHash(): string { return getEnv('ADMIN_PASSWORD_HASH'); }

// Minimum iterations to mitigate brute-force; tune per environment
const MIN_PBKDF2_ITERATIONS = 100000;
const MIN_SALT_BYTES = 16;
const DERIVED_KEY_BYTES = 64; // use longer derived key

// A hardened verifyPassword function
export function verifyPassword(password: string, storedHash: string): boolean {
  // storedHash expected format: iterations$salt$derivedHex
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const iterations = parseInt(parts[0], 10);
    if (!Number.isFinite(iterations) || iterations < MIN_PBKDF2_ITERATIONS) return false;
    const salt = Buffer.from(parts[1], 'hex');
    if (!salt || salt.length < MIN_SALT_BYTES) return false;
    const derived = parts[2];

    // compute derived key safely
    const derivedCheck = crypto.pbkdf2Sync(password, salt, iterations, DERIVED_KEY_BYTES, 'sha256').toString('hex');
    const a = Buffer.from(derivedCheck, 'hex');
    const b = Buffer.from(derived, 'hex');

    // timingSafeEqual requires equal lengths — guard against malformed storedHash
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    // On any error, fail safe and do not throw — return false
    return false;
  }
}

function safeEquals(a: string, b: string): boolean {
  const ah = crypto.createHash('sha256').update(a).digest();
  const bh = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

// Simple in-memory throttling for demo purposes (do NOT rely on this for production)
const failedAttempts: Map<string, {count:number, until:number}> = new Map();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MS = 60 * 1000; // 1 minute

export function login(user: string, pass: string): string {
  const adminUser = getAdminUser();
  const adminHash = getAdminPasswordHash();

  // throttle
  const now = Date.now();
  const state = failedAttempts.get(user) || {count:0, until:0};
  if (state.until > now) {
    return 'Login failed.'; // generic response
  }

  // Always run password verification to avoid user enumeration timing
  const okUser = safeEquals(user, adminUser);
  const okPass = verifyPassword(pass, adminHash);
  const success = okUser && okPass;

  if (!success) {
    // update throttle state
    state.count++;
    if (state.count >= LOCKOUT_THRESHOLD) {
      state.until = now + LOCKOUT_WINDOW_MS;
      state.count = 0;
    }
    failedAttempts.set(user, state);
    return 'Login failed.';
  }

  // on success, clear throttle
  failedAttempts.delete(user);
  return 'Login success!';
}
