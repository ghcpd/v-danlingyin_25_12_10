const fs = require('fs');
const path = require('path');

const fileArg = process.argv[2] || 'input.ts';
const filePath = path.resolve(__dirname, fileArg);

function containsSecretPatterns(content) {
  const patterns = [
    /Environment variable required:/, // specific old message
    /toString\(\s*'utf8'\s*\)/, // old private key string conversion
    /const\s+MAX_ITERATIONS\s*=\s*200000/, // old high MAX
    /-----BEGIN (RSA |)PRIVATE KEY-----/, // private key literal
    /sk_live_[A-Za-z0-9_\-]+/, // example Stripe live key pattern
    /AKIA[0-9A-Z]{16}/ // example AWS Access Key
  ];
  for (const re of patterns) {
    if (re.test(content)) return {match: true, pattern: re.toString()};
  }
  return {match: false};
}

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const r = containsSecretPatterns(content);
  if (r.match) {
    console.error('FAIL: forbidden pattern found:', r.pattern);
    process.exit(1);
  }
  console.log('PASS: no forbidden patterns detected');
  process.exit(0);
} catch (err) {
  console.error('ERROR reading file', filePath, err.message);
  process.exit(2);
}
