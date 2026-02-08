#!/usr/bin/env ts-node

/**
 * Comprehensive Security Audit
 * Run: npm run security:audit
 */

import { runSecurityAudit } from '../src/lib/security/testing';

async function main() {
  try {
    const auditResults = await runSecurityAudit();

    // Generate audit report
    console.log('\n📊 AUDIT REPORT');
    console.log('='.repeat(70));
    console.log(`Status: ${auditResults.status}`);
    console.log(`Timestamp: ${auditResults.timestamp.toISOString()}`);
    console.log(`Tests Passed: ${auditResults.testResults.passed}/${auditResults.testResults.tests.length}`);
    console.log(`Duration: ${auditResults.testResults.duration}ms`);
    console.log('='.repeat(70));

    // Detailed findings
    if (auditResults.testResults.tests.length > 0) {
      console.log('\n📋 DETAILED FINDINGS');
      
      const failed = auditResults.testResults.tests.filter(t => !t.passed);
      if (failed.length > 0) {
        console.log('\nFailed Tests:');
        failed.forEach(test => {
          console.log(`  ❌ [${test.severity.toUpperCase()}] ${test.name}`);
          if (test.error) {
            console.log(`     Error: ${test.error}`);
          }
        });
      }

      const passed = auditResults.testResults.tests.filter(t => t.passed);
      if (passed.length > 0) {
        console.log(`\nPassed Tests: ${passed.length}`);
        console.log('  ✅ All critical security controls verified');
      }
    }

    console.log('\n🎯 RECOMMENDATIONS');
    console.log('='.repeat(70));

    if (auditResults.status === 'PASSED') {
      console.log('✅ System is secure and ready for production deployment');
      console.log('\nNext Steps:');
      console.log('  1. Run npm run verify:deployment for final checks');
      console.log('  2. Deploy to production with monitoring enabled');
      console.log('  3. Schedule weekly security audits');
      console.log('  4. Monitor security alerts in real-time');
    } else {
      console.log('⚠️  Security issues detected - remediation required');
      console.log('\nNext Steps:');
      console.log('  1. Review failed tests above');
      console.log('  2. Address findings immediately');
      console.log('  3. Re-run audit after fixes');
      console.log('  4. Do not deploy until all tests pass');
    }

    console.log('='.repeat(70));

    // Exit with appropriate code
    process.exit(auditResults.status === 'PASSED' ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Audit error:', error);
    process.exit(1);
  }
}

main();
