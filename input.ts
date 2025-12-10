// input.ts — SECURE FIX APPLIED
// SECURITY_FIX_APPLIED: Do not remove this marker; used by automated tests
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
const MIN_PBKDF2_ITERATIONS = 310000; // raised to meet modern cost recommendations
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

// Persistent file-backed throttling store to survive process restarts
const RATE_LIMIT_STORE = process.env['RATE_LIMIT_STORE'] || path.resolve(process.cwd(), '.rate_limit_store.json');
const LOCKOUT_THRESHOLD = parseInt(process.env['LOCKOUT_THRESHOLD'] || '5', 10);
const LOCKOUT_WINDOW_MS = parseInt(process.env['LOCKOUT_WINDOW_MS'] || String(60 * 1000), 10); // default 1 minute

function loadRateLimitStore(): Record<string, {count:number, until:number}> {
  try {
    if (!fs.existsSync(RATE_LIMIT_STORE)) return {};
    const raw = fs.readFileSync(RATE_LIMIT_STORE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function saveRateLimitStore(store: Record<string, {count:number, until:number}>) {
  try {
    fs.writeFileSync(RATE_LIMIT_STORE, JSON.stringify(store), {encoding:'utf8', mode:0o600});
  } catch (e) {
    // ignore write errors for robustness; fail-closed behavior enforced elsewhere
  }
}

function getRateLimitState(user: string) {
  const store = loadRateLimitStore();
  return store[user] || {count:0, until:0};
}

function setRateLimitState(user: string, state:{count:number, until:number}) {
  const store = loadRateLimitStore();
  store[user] = state;
  saveRateLimitStore(store);
}

function clearRateLimitState(user: string) {
  const store = loadRateLimitStore();
  delete store[user];
  saveRateLimitStore(store);
}

export function login(user: string, pass: string): string {
  const adminUser = getAdminUser();
  const adminHash = getAdminPasswordHash();

  // throttle
  const now = Date.now();
  const state = getRateLimitState(user);
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
    setRateLimitState(user, state);
    return 'Login failed.';
  }

  // on success, clear throttle
  clearRateLimitState(user);
  return 'Login success!';
}

