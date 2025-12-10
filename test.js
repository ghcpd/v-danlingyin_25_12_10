const fs = require('fs');
const path = process.argv[2];
const content = fs.readFileSync(path, 'utf8');
if (content.includes('crypto.pbkdf2Sync')) {
  console.log('FAIL');
} else {
  console.log('PASS');
}