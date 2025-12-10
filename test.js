// test.js - simple security validator for the audit
const fs = require('fs');
const path = require('path');

function die(msg) { console.error(msg); process.exit(1); }

const target = process.argv[2];
if (!target) die('Usage: node test.js <file-to-test>');

const content = fs.readFileSync(path.resolve(target),'utf8');

// 1) Marker check - ensure SECURE marker exists
if (!content.includes('SECURITY_FIX_APPLIED')) {
  console.error('FAIL: SECURITY_FIX_APPLIED marker not found');
  process.exit(1);
}

// 2) Heuristic secret patterns - fail if obvious secrets are present
const secretRegex = /(?:api[_-]?key|secret|password|private\s*key|aws_access_key|-----BEGIN).*[A-Za-z0-9_\-\/=+]{8,}/i;
if (secretRegex.test(content)) {
  console.error('FAIL: Potential hardcoded secret pattern detected');
  process.exit(1);
}

console.log('PASS: file looks secure');
process.exit(0);
