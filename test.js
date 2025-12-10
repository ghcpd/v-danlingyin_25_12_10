// test.js — simple Node test that inspects a TypeScript file for secrets and a secure marker
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node test.js <file>');
  process.exit(2);
}

const file = process.argv[2];
try {
  const content = fs.readFileSync(path.resolve(file), 'utf8');

  // Patterns that commonly indicate hardcoded secrets. Avoid matching identifiers like getJwtSecret; focus on literal assignments.
  const secretPatterns = [
    /api[_-]?key/i,
    /private[_-]?key/i,
    /-----BEGIN [A-Z ]+PRIVATE KEY-----/i,
    /password/i,
    /jwt[_-]?secret/i,
    /db[_-]?(uri|password|user|conn|connection)/i
  ];

  for (const re of secretPatterns) {
    if (re.test(content)) {
      console.error('FAIL: Potential secret pattern matched:', re);
      process.exit(1);
    }
  }

  // Additional heuristic: very long base64-like strings (over 80 chars)
  const longBase64 = /[A-Za-z0-9+/]{80,}={0,2}/g;
  if (longBase64.test(content)) {
    console.error('FAIL: Found long base64-like string which may be a secret');
    process.exit(1);
  }

  // Check for secure marker added to fixed file
  if (!/export\s+const\s+__SECURE__\s*=\s*true\s*;/.test(content)) {
    console.error('FAIL: secure marker not found (file not marked as fixed)');
    process.exit(1);
  }

  console.log('PASS');
  process.exit(0);
} catch (err) {
  console.error('ERROR reading file:', err.message);
  process.exit(2);
}
