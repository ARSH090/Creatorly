import { POST } from '@/app/api/analytics/track/route';
import { createTestRequest } from '@/tests/utils/api-test-utils';
import AnalyticsEvent from '@/lib/models/AnalyticsEvent';
import { connectToDatabase } from '@/lib/db/mongodb';

describe('POST /api/analytics/track', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    afterAll(async () => {
        await AnalyticsEvent.deleteMany({ creatorId: 'test-creator-123' });
    });

    it('should track page view event', async () => {
        const req = createTestRequest({
            method: 'POST',
            body: {
                eventType: 'page_view',
                creatorId: 'test-creator-123',
                path: '/testcreator',
                referrer: 'https://google.com',
            },
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);

        const event = await AnalyticsEvent.findOne({ creatorId: 'test-creator-123', eventType: 'page_view' });
        expect(event).not.toBeNull();
    });

    it('should validate event type', async () => {
        const req = createTestRequest({
            method: 'POST',
            body: {
                eventType: 'invalid_event',
                creatorId: 'test-creator-123',
            },
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
