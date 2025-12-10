const fs = require('fs');
const path = require('path');

/**
 * Test Runner - Executes tests with expected pass/fail states
 * Supports multiple test items and computes overall pass rate
 */

const TEST_ITEMS = [
  {
    name: 'input_backup.ts (Vulnerable)',
    file: 'input_backup.ts',
    expectedResult: 'FAIL',
    description: 'Should detect vulnerabilities'
  },
  {
    name: 'input.ts (Fixed)',
    file: 'input.ts',
    expectedResult: 'PASS',
    description: 'Should verify all fixes applied'
  }
];

function checkFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, message: `File not found: ${filePath}` };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    // Determine if file has vulnerabilities (backup) or fixes (fixed)
    const hasVulnerabilityUsername = /if\s*\(\s*user\s*!==\s*adminUser\s*\)/.test(content);
    
    // Check for fixes in fixed version
    const hasMinIterations = content.includes('MIN_PBKDF2_ITERATIONS');
    const hasIterationCheck = content.includes('iterations < MIN_PBKDF2_ITERATIONS');
    const hasTimingSafeEqual = content.includes('crypto.timingSafeEqual');
    const hasBufferFromUser = content.includes('Buffer.from(user');
    
    const hasFixes = hasMinIterations && hasIterationCheck && hasTimingSafeEqual && hasBufferFromUser;

    if (fileName === 'input_backup.ts') {
      return {
        success: hasVulnerabilityUsername,
        result: hasVulnerabilityUsername ? 'FAIL' : 'PASS',
        message: hasVulnerabilityUsername 
          ? `✓ Vulnerabilities detected (expected)` 
          : `✗ No vulnerabilities found (unexpected)`
      };
    } else if (fileName === 'input.ts') {
      const isVulnerable = hasVulnerabilityUsername;
      const isFixed = hasFixes;
      const success = !isVulnerable && isFixed;
      
      return {
        success: success,
        result: success ? 'PASS' : 'FAIL',
        message: success
          ? `✓ All fixes applied successfully`
          : `✗ Missing security fixes`,
        details: {
          hasMinIterations,
          hasIterationCheck,
          hasTimingSafeEqual,
          hasBufferFromUser,
          hasVulnerabilityUsername
        }
      };
    }

    return { success: false, message: 'Unknown file type' };
  } catch (error) {
    return { success: false, message: `Error checking file: ${error.message}` };
  }
}

function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      SECURITY TEST RUNNER v1.0        ║');
  console.log('╚════════════════════════════════════════╝\n');

  const results = [];
  let passCount = 0;

  TEST_ITEMS.forEach((item, index) => {
    console.log(`[${index + 1}/${TEST_ITEMS.length}] Testing: ${item.name}`);
    console.log(`    Description: ${item.description}`);
    console.log(`    Expected: ${item.expectedResult}`);

    const filePath = path.join(__dirname, item.file);
    const check = checkFile(filePath);
    const meetsExpectation = check.result === item.expectedResult;

    console.log(`    Result: ${check.result} ${meetsExpectation ? '✓' : '✗'}`);
    console.log(`    ${check.message}`);
    if (check.details) {
      console.log(`    Details:`);
      console.log(`      - hasMinIterations: ${check.details.hasMinIterations}`);
      console.log(`      - hasIterationCheck: ${check.details.hasIterationCheck}`);
      console.log(`      - hasTimingSafeEqual: ${check.details.hasTimingSafeEqual}`);
      console.log(`      - hasBufferFromUser: ${check.details.hasBufferFromUser}`);
      console.log(`      - hasVulnerabilityUsername: ${check.details.hasVulnerabilityUsername}`);
    }
    console.log();

    results.push({
      test: item.name,
      expected: item.expectedResult,
      actual: check.result,
      passed: meetsExpectation
    });

    if (meetsExpectation) passCount++;
  });

  const passRate = ((passCount / TEST_ITEMS.length) * 100).toFixed(1);
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║          TEST SUMMARY                 ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`Pass Rate: ${passCount}/${TEST_ITEMS.length} (${passRate}%)`);
  console.log(`Status: ${passCount === TEST_ITEMS.length ? 'TEST PASSED ✓' : 'TEST FAILED ✗'}\n`);

  return {
    passRate,
    passCount,
    totalCount: TEST_ITEMS.length,
    allPassed: passCount === TEST_ITEMS.length,
    results
  };
}

// Run if called directly
if (require.main === module) {
  const testResults = runTests();
  process.exit(testResults.allPassed ? 0 : 1);
}

module.exports = { runTests };
