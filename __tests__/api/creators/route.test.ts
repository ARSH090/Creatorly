import { GET, POST } from '@/app/api/creators/route';
import { createTestRequest, authenticatedRequest } from '@/tests/utils/api-test-utils';
import CreatorProfile from '@/lib/models/CreatorProfile';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

describe('Creator API', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    afterAll(async () => {
        await CreatorProfile.deleteMany({ username: 'testcreator' });
        await User.deleteMany({ email: 'creator@example.com' });
    });

    describe('POST /api/creators', () => {
        let testUser: any;

        beforeAll(async () => {
            testUser = await User.findOneAndUpdate(
                { email: 'creator@example.com' },
                {
                    firebaseUid: 'creator-uid',
                    displayName: 'Creator User',
                    role: 'creator',
                },
                { upsert: true, new: true }
            );
        });

        it('should create creator profile', async () => {
            const req = await authenticatedRequest({
                method: 'POST',
                userId: testUser._id.toString(),
                role: 'creator',
                body: {
                    username: 'testcreator',
                    displayName: 'Test Creator',
                    bio: 'This is a test bio',
                },
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.data.username).toBe('testcreator');
        });

        it('should check username uniqueness', async () => {
            const req = await authenticatedRequest({
                method: 'POST',
                userId: testUser._id.toString(),
                role: 'creator',
                body: {
                    username: 'testcreator',
                    displayName: 'Duplicate',
                },
            });

            const response = await POST(req);
            expect(response.status).toBe(409);
        });

        it('should block non-creator from creating profile', async () => {
            const req = await authenticatedRequest({
                method: 'POST',
                userId: 'customer-id',
                role: 'customer',
                body: {
                    username: 'hacker',
                    displayName: 'Hacker',
                },
            });

            const response = await POST(req);
            expect(response.status).toBe(403);
        });
    });
});
