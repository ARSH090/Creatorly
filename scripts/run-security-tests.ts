#!/usr/bin/env ts-node

/**
 * Security Tests Runner
 * Run: npm run security:test
 */

import { runSecurityTests } from '../src/lib/security/testing';

async function main() {
  console.log('\n🔐 CREATORLY SECURITY TEST SUITE');
  console.log('='.repeat(70));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(70));

  try {
    const results = await runSecurityTests();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  }
}

main();
