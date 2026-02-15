import { GET } from '@/app/api/health/route';
import { createTestRequest } from '@/tests/utils/api-test-utils';
import { connectToDatabase } from '@/lib/db/mongodb';

describe('GET /api/health', () => {
    it('should return healthy status when MongoDB is up', async () => {
        await connectToDatabase();
        const req = createTestRequest({ method: 'GET' });
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('healthy');
        expect(data.checks.mongodb).toBe(true);
    });
});
