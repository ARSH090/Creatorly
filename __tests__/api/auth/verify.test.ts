import { POST } from '@/app/api/auth/verify/route';
import { createTestRequest } from '@/tests/utils/api-test-utils';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

// Mock Firebase Admin
jest.mock('firebase-admin/auth', () => ({
    getAuth: jest.fn(() => ({
        verifyIdToken: jest.fn((token) => {
            if (token === 'valid-token') {
                return Promise.resolve({ uid: 'test-uid', email: 'test@example.com' });
            }
            if (token === 'expired-token') {
                const err: any = new Error('Token expired');
                err.code = 'auth/id-token-expired';
                throw err;
            }
            throw new Error('Invalid token');
        })
    }))
}));

describe('POST /api/auth/verify', () => {
    beforeAll(async () => {
        await connectToDatabase();
        // Ensure test user exists
        await User.findOneAndUpdate(
            { firebaseUid: 'test-uid' },
            {
                email: 'test@example.com',
                displayName: 'Test User',
                role: 'creator'
            },
            { upsert: true }
        );
    });

    it('should verify valid token', async () => {
        const req = createTestRequest({
            method: 'POST',
            body: { idToken: 'valid-token' },
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.valid).toBe(true);
        expect(data.user.email).toBe('test@example.com');
    });

    it('should reject invalid token', async () => {
        const req = createTestRequest({
            method: 'POST',
            body: { idToken: 'invalid-token' },
        });

        const response = await POST(req);
        expect(response.status).toBe(401);
    });

    it('should handle missing token', async () => {
        const req = createTestRequest({
            method: 'POST',
            body: {},
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
