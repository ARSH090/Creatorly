/**
 * CREATORLY SECURITY TESTING AUTOMATION
 * Automated security verification and testing suite
 */

import crypto from 'crypto';

// ============================================================================
// SECURITY TEST SUITE
// ============================================================================

export interface SecurityTest {
  name: string;
  category: 'injection' | 'auth' | 'rate_limit' | 'headers' | 'encryption' | 'fraud';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  testFunction: () => Promise<boolean>;
  autoFix?: () => Promise<void>;
}

const securityTests: SecurityTest[] = [];

export function registerSecurityTest(test: SecurityTest) {
  securityTests.push(test);
}

// ============================================================================
// INJECTION ATTACK DETECTION TESTS
// ============================================================================

registerSecurityTest({
    name: 'AES-256-GCM encryption/decryption roundtrip',
    category: 'encryption',
    severity: 'critical',
    description: 'Verifies encryption produces ciphertext and decryption restores plaintext',
    testFunction: async () => {
        const { encryptTokenGCM, decryptTokenGCM } = await import('@/lib/security/encryption');
        const secret = process.env.META_APP_SECRET || '0'.repeat(64);
        const key = Buffer.from(secret.slice(0,64).padEnd(64,'0'), 'hex');
        const plaintext = 'test-bank-account-123456';
        const { encryptedData, iv, tag } = encryptTokenGCM(plaintext, key);
        if (encryptedData === plaintext) return false; // must be encrypted
        const decrypted = decryptTokenGCM(encryptedData, iv, tag, key);
        return decrypted === plaintext;
    }
});

registerSecurityTest({
    name: 'Razorpay webhook signature verification rejects tampered payloads',
    category: 'fraud',
    severity: 'critical',
    description: 'Verifies HMAC-SHA256 rejects payloads with wrong signature',
    testFunction: async () => {
        const { verifyRazorpaySignature } = await import('@/lib/payments/razorpay');
        const valid = verifyRazorpaySignature('order_123', 'pay_456', (() => {
            const crypto = require('crypto');
            return crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test').update('order_123|pay_456').digest('hex');
        })());
        const invalid = verifyRazorpaySignature('order_123', 'pay_456', 'fake_sig_12345');
        const tampered = verifyRazorpaySignature('order_999', 'pay_456', (() => {
            const crypto = require('crypto');
            return crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test').update('order_123|pay_456').digest('hex');
        })());
        return valid === true && invalid === false && tampered === false;
    }
});

registerSecurityTest({
    name: 'Instagram webhook signature verification',
    category: 'fraud',
    severity: 'high',
    description: 'Verifies Meta HMAC-SHA256 signature check works correctly',
    testFunction: async () => {
        const { InstagramService } = await import('@/lib/services/instagram');
        const secret = 'test-ig-secret';
        const payload = JSON.stringify({ entry: [{ id: '123' }] });
        const crypto = require('crypto');
        const validSig = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const valid = InstagramService.verifyWebhookSignature(payload, validSig, secret);
        const invalid = InstagramService.verifyWebhookSignature(payload, 'sha256=fakehash', secret);
        return valid === true && invalid === false;
    }
});

registerSecurityTest({
    name: 'DOMPurify strips XSS from user HTML',
    category: 'injection',
    severity: 'critical',
    description: 'Verifies sanitizeHtml() removes script tags and event handlers',
    testFunction: async () => {
        const { sanitizeHtml } = await import('@/lib/utils/sanitizer');
        const xssPayloads = [
            '<script>alert(1)</script>Hello',
            '<img src="x" onerror="alert(1)">',
            '<svg onload="alert(1)">',
            'javascript:void(0)',
        ];
        for (const payload of xssPayloads) {
            const result = sanitizeHtml(payload);
            if (result.includes('<script') || result.includes('onerror') || result.includes('onload')) {
                console.error(`XSS not stripped: ${payload} → ${result}`);
                return false;
            }
        }
        return true;
    }
});

registerSecurityTest({
    name: 'CSS sanitizer blocks dangerous patterns',
    category: 'injection',
    severity: 'high',
    description: 'Verifies sanitizeCss() blocks javascript:, expression(), @import',
    testFunction: async () => {
        const { sanitizeCss } = await import('@/lib/utils/sanitizer');
        const dangerous = [
            'body { background: url(javascript:alert(1)) }',
            'div { behavior: expression(alert(1)) }',
            '@import url(http://evil.com/steal.css)',
        ];
        for (const css of dangerous) {
            const result = sanitizeCss(css);
            if (result.includes('javascript:') || result.includes('expression(') || (result.includes('@import') && result.includes('evil'))) {
                console.error(`Dangerous CSS not blocked: ${css}`);
                return false;
            }
        }
        return true;
    }
});

registerSecurityTest({
    name: 'GST calculation correct for intrastate and interstate',
    category: 'encryption',
    severity: 'medium',
    description: 'Verifies CGST+SGST for intrastate and IGST for interstate',
    testFunction: async () => {
        const { calculateGST } = await import('@/lib/compliance/gst');
        const intra = calculateGST(1000, { stateOfOrigin: 'MH', stateOfConsumption: 'MH' });
        const inter = calculateGST(1000, { stateOfOrigin: 'MH', stateOfConsumption: 'KA' });
        const intraOk = Math.abs(intra.cgst - 90) < 1 && Math.abs(intra.sgst - 90) < 1 && intra.igst === 0;
        const interOk = inter.igst === 180 && inter.cgst === 0 && inter.sgst === 0;
        return intraOk && interOk;
    }
});

// ============================================================================
// TEST RUNNER
// ============================================================================

export interface TestResults {
  passed: number;
  failed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  tests: Array<{
    name: string;
    category: string;
    severity: string;
    passed: boolean;
    error?: string;
  }>;
  timestamp: Date;
  duration: number;
}

export async function runSecurityTests(): Promise<TestResults> {
  const startTime = Date.now();
  const results: TestResults = {
    passed: 0,
    failed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    tests: [],
    timestamp: new Date(),
    duration: 0
  };

  console.log('\n🔒 SECURITY TEST SUITE');
  console.log('='.repeat(60));

  for (const test of securityTests) {
    try {
      console.log(`\n[${test.severity.toUpperCase()}] ${test.name}`);
      console.log(`  ${test.description}`);

      const passed = await test.testFunction();

      if (passed) {
        results.passed++;
        console.log('  ✅ PASSED');
      } else {
        results.failed++;
        console.log('  ❌ FAILED');
      }

      // Count by severity
      if (test.severity === 'critical') results.critical++;
      else if (test.severity === 'high') results.high++;
      else if (test.severity === 'medium') results.medium++;
      else if (test.severity === 'low') results.low++;

      results.tests.push({
        name: test.name,
        category: test.category,
        severity: test.severity,
        passed
      });
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: test.name,
        category: test.category,
        severity: test.severity,
        passed: false,
        error: String(error)
      });

      console.log(`  ❌ ERROR: ${error}`);
    }
  }

  results.duration = Date.now() - startTime;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}/${securityTests.length}`);
  console.log(`❌ Failed: ${results.failed}/${securityTests.length}`);
  console.log(`⏱️  Duration: ${results.duration}ms`);
  console.log('\nSeverity Breakdown:');
  console.log(`  🔴 Critical: ${results.critical}`);
  console.log(`  🟠 High: ${results.high}`);
  console.log(`  🟡 Medium: ${results.medium}`);
  console.log(`  🟢 Low: ${results.low}`);

  if (results.failed === 0) {
    console.log('\n✅ ALL SECURITY TESTS PASSED!');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed - review required`);
  }

  console.log('='.repeat(60) + '\n');

  return results;
}

// ============================================================================
// SECURITY AUDIT RUNNER
// ============================================================================

export async function runSecurityAudit() {
  console.log('\n🔐 COMPREHENSIVE SECURITY AUDIT');
  console.log('='.repeat(60));
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV);

  // Check environment variables
  console.log('\n📋 ENVIRONMENT VALIDATION');
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    const present = !!process.env[envVar];
    console.log(`  ${present ? '✅' : '❌'} ${envVar}`);
  }

  // Run security tests
  const testResults = await runSecurityTests();

  return {
    timestamp: new Date(),
    audit: 'comprehensive',
    testResults,
    status: testResults.failed === 0 ? 'PASSED' : 'FAILED'
  };
}

// Export for CI/CD integration
export default runSecurityAudit;
