#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CRITICAL_CHECKS = [
    {
        name: 'JWT Cookie Security',
        check: () => {
            // Middleware path may vary, searching src/middleware.ts
            const middlewarePath = path.join(__dirname, '../src/middleware.ts');
            if (!fs.existsSync(middlewarePath)) return false;
            const content = fs.readFileSync(middlewarePath, 'utf8');
            return content.includes('httpOnly: true');
        }
    },
    {
        name: 'XSS Audit - dangerouslySetInnerHTML',
        check: () => {
            const results = [];
            const srcPath = path.join(__dirname, '../src');
            if (!fs.existsSync(srcPath)) return true;

            function scanDir(dir) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const fullPath = path.join(dir, file);
                    if (fs.statSync(fullPath).isDirectory()) {
                        if (file !== 'node_modules' && file !== '.next') {
                            scanDir(fullPath);
                        }
                    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        if (content.includes('dangerouslySetInnerHTML')) {
                            results.push({
                                file: fullPath,
                                lines: content.split('\n')
                                    .map((line, idx) => line.includes('dangerouslySetInnerHTML') ? idx + 1 : null)
                                    .filter(Boolean)
                            });
                        }
                    }
                });
            }
            scanDir(srcPath);
            // Usually only 0-2 files (JSON-LD or GA) should have this
            console.log(`   Found ${results.length} instances of dangerouslySetInnerHTML`);
            return results.length <= 5;
        }
    },
    {
        name: 'Rate Limiting Coverage Check',
        check: () => {
            const apiDir = path.join(__dirname, '../src/app/api');
            if (!fs.existsSync(apiDir)) return true;
            const missingRateLimit = [];

            function checkEndpoint(dir) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const fullPath = path.join(dir, file);
                    if (fs.statSync(fullPath).isDirectory()) {
                        checkEndpoint(fullPath);
                    } else if (file === 'route.ts') {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const isPublic = content.includes('// @public') ||
                            fullPath.includes('webhook') ||
                            fullPath.includes('social/instagram/data-deletion') ||
                            fullPath.includes('cron');

                        const hasRateLimit = content.includes('rateLimit') ||
                            content.includes('rateLimiter') ||
                            content.includes('withRateLimit');

                        if (!isPublic && !hasRateLimit) {
                            // Only flag internal creator/admin APIs
                            if (fullPath.includes('/api/creator') || fullPath.includes('/api/admin')) {
                                missingRateLimit.push(fullPath.replace(apiDir, ''));
                            }
                        }
                    }
                });
            }

            checkEndpoint(apiDir);
            if (missingRateLimit.length > 0) {
                console.log(`   Missing rate limit on: ${missingRateLimit.join(', ')}`);
            }
            return missingRateLimit.length < 5; // Threshold for warning
        }
    }
];

console.log('\n🔐 [AUDIT] STARTING FINAL SECURITY VERIFICATION\n');
console.log('='.repeat(60));

let passed = 0;
CRITICAL_CHECKS.forEach((check, idx) => {
    try {
        const result = check.check();
        console.log(`${result ? '✅' : '❌'} ${idx + 1}. ${check.name}`);
        if (!result) console.log(`   [FAIL] Manual review required for ${check.name}`);
        else passed++;
    } catch (error) {
        console.log(`❌ ${idx + 1}. ${check.name}`);
        console.log(`   [ERROR] ${error.message}`);
    }
});

console.log('='.repeat(60));
console.log(`\nAudit Result: ${passed}/${CRITICAL_CHECKS.length} checks completed successfully`);
process.exit(passed === CRITICAL_CHECKS.length ? 0 : 1);
