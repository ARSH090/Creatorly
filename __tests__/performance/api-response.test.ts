import { GET } from '@/app/api/products/route';
import { GET as getHealth } from '@/app/api/health/route';
import { createTestRequest } from '@/tests/utils/api-test-utils';
import { connectToDatabase } from '@/lib/db/mongodb';

describe('API Performance Benchmarks', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    it('should respond to health check under 100ms', async () => {
        const start = performance.now();
        const req = createTestRequest({ method: 'GET' });
        await getHealth(req);
        const end = performance.now();

        expect(end - start).toBeLessThan(100);
    });

    it('should respond to products list under 200ms', async () => {
        const start = performance.now();
        const req = createTestRequest({ method: 'GET' });
        await GET(req);
        const end = performance.now();

        expect(end - start).toBeLessThan(200);
    });
});
