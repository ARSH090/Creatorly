import { NextResponse } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { promises as fs } from 'fs';
import path from 'path';

export const GET = withCreatorAuth(async (req) => {
    try {
        const reportPath = path.join(process.cwd(), 'tests', 'report', 'results.json');

        try {
            const data = await fs.readFile(reportPath, 'utf8');
            const results = JSON.parse(data);

            // Extract some stats
            const stats = {
                total: results.config?.metadata?.total || 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                timestamp: results.stats?.startTime || new Date().toISOString()
            };

            // Calculate passes/fails if not in metadata
            if (results.suites) {
                let total = 0;
                let passed = 0;
                let failed = 0;

                const processSuite = (suite: any) => {
                    if (suite.specs) {
                        suite.specs.forEach((spec: any) => {
                            total++;
                            if (spec.ok) passed++;
                            else failed++;
                        });
                    }
                    if (suite.suites) {
                        suite.suites.forEach(processSuite);
                    }
                };

                results.suites.forEach(processSuite);
                stats.total = total;
                stats.passed = passed;
                stats.failed = failed;
            }

            return NextResponse.json({
                success: true,
                stats,
                results: results.suites || []
            });
        } catch (e) {
            return NextResponse.json({
                success: false,
                message: 'No test results found. Run tests first.',
                error: (e as Error).message
            }, { status: 404 });
        }
    } catch (error) {
        console.error('QA Status Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Error' }, { status: 500 });
    }
});
