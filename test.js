const fs = require('fs');
const path = require('path');

/**
 * Test script to validate security fixes
 * - Checks input_backup.ts for vulnerabilities (should FAIL)
 * - Checks input.ts for fixes (should PASS)
 */

const VULN_PATTERNS = [
  { pattern: /iterations\s*<=\s*0/i, name: 'Weak iteration check (allows <= 0)' },
  { pattern: /if\s*\(\s*user\s*!==\s*adminUser\s*\)/i, name: 'Timing attack vulnerable username comparison' },
  { pattern: /MIN_PBKDF2_ITERATIONS/i, name: 'Minimum iterations enforced' },
  { pattern: /crypto\.timingSafeEqual.*user/i, name: 'Constant-time username comparison' }
];

function checkFile(filePath, expectedStatus) {
  if (!fs.existsSync(filePath)) {
    return { pass: false, error: `File not found: ${filePath}` };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const results = {
    pass: false,
    file: path.basename(filePath),
    expectedStatus: expectedStatus,
    findings: []
  };

  // Check for vulnerable patterns in BACKUP
  if (expectedStatus === 'FAIL') {
    const vulnerablePatterns = [
      /iterations\s*<=\s*0/i,
      /if\s*\(\s*user\s*!==\s*adminUser\s*\)/i
    ];
    
    let foundVulnerabilities = 0;
    for (const pattern of vulnerablePatterns) {
      if (pattern.test(content)) {
        results.findings.push(`✗ VULNERABLE: ${pattern}`);
        foundVulnerabilities++;
      }
    }
    
    results.pass = foundVulnerabilities > 0;
    results.status = foundVulnerabilities > 0 ? 'FAIL (as expected)' : 'PASS (unexpected - fixes applied?)';
  }
  
  // Check for fixes in FIXED version
  if (expectedStatus === 'PASS') {
    const fixes = [
      { pattern: /MIN_PBKDF2_ITERATIONS\s*=\s*100000/, name: 'Minimum iterations constant defined' },
      { pattern: /iterations\s*<\s*MIN_PBKDF2_ITERATIONS/, name: 'Iteration validation enforced' },
      { pattern: /crypto\.timingSafeEqual.*Buffer\.from\(user/i, name: 'Timing-safe username comparison' }
    ];
    
    let foundFixes = 0;
    for (const fix of fixes) {
      if (fix.pattern.test(content)) {
        results.findings.push(`✓ FIXED: ${fix.name}`);
        foundFixes++;
      } else {
        results.findings.push(`✗ MISSING: ${fix.name}`);
      }
    }
    
    results.pass = foundFixes === fixes.length;
    results.status = results.pass ? 'PASS (fixes applied)' : 'FAIL (incomplete fixes)';
  }

  return results;
}

function runTests() {
  console.log('\n========================================');
  console.log('SECURITY FIX VALIDATION TEST');
  console.log('========================================\n');

  const backupTest = checkFile(
    path.join(__dirname, 'input_backup.ts'),
    'FAIL'
  );

  const fixedTest = checkFile(
    path.join(__dirname, 'input.ts'),
    'PASS'
  );

  console.log(`[BACKUP] ${backupTest.file}`);
  console.log(`Expected: ${backupTest.expectedStatus} | Got: ${backupTest.status}`);
  backupTest.findings.forEach(f => console.log(`  ${f}`));
  console.log();

  console.log(`[FIXED] ${fixedTest.file}`);
  console.log(`Expected: ${fixedTest.expectedStatus} | Got: ${fixedTest.status}`);
  fixedTest.findings.forEach(f => console.log(`  ${f}`));
  console.log();

  const overallPass = backupTest.pass && fixedTest.pass;
  console.log(`Overall Result: ${overallPass ? 'TEST PASSED ✓' : 'TEST FAILED ✗'}`);
  console.log('========================================\n');

  return overallPass ? 0 : 1;
}

process.exit(runTests());
