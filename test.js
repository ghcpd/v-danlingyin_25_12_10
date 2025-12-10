const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node test.js <file>');
  process.exit(2);
}

if (process.argv.length < 3) usage();

const target = process.argv[2];
const full = path.resolve(target);
try {
  const content = fs.readFileSync(full, 'utf8');

  const checks = [];

  // 1) Detect the specific information-leak error string that was present in the original file
  if (content.indexOf('Missing required environment variable:') !== -1) {
    checks.push({id: 'env-name-leak', ok: false, msg: 'Contains explicit env name in thrown error'});
  }

  // 2) Detect pbkdf2Sync without a MAX_PBKDF2_ITERATIONS guard
  const usesPbkdf2Sync = content.indexOf('pbkdf2Sync(') !== -1;
  const hasGuard = content.indexOf('MAX_PBKDF2_ITERATIONS') !== -1;
  if (usesPbkdf2Sync && !hasGuard) {
    checks.push({id: 'pbkdf2-unbounded', ok: false, msg: 'pbkdf2Sync used without an iterations upper bound'});
  }

  // 3) Basic hardcoded secret heuristic (simple, low-noise)
  const secretPattern = /(?:API[_-]?KEY|SECRET|PRIVATE[_-]?KEY|PASSWORD|JWT|TOKEN)\s*[:=]\s*['\"]\w{8,}['\"]/i;
  if (secretPattern.test(content)) {
    checks.push({id: 'hardcoded-secret', ok: false, msg: 'Possible hardcoded secret-like string detected'});
  }

  // In absence of failing checks, pass
  const failed = checks.filter(c => !c.ok);
  if (failed.length > 0) {
    console.error('FAIL');
    failed.forEach(c => console.error(`- ${c.id}: ${c.msg}`));
    process.exit(1);
  }

  console.log('PASS');
  process.exit(0);

} catch (err) {
  console.error('ERROR reading', full, err && err.message);
  process.exit(2);
}
