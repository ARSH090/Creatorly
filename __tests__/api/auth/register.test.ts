import { POST } from '@/app/api/auth/register/route';
import { createTestRequest } from '@/tests/utils/api-test-utils';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

// Mock Firebase Admin verifyIdToken
jest.mock('firebase-admin/auth', () => ({
    getAuth: jest.fn(() => ({
        verifyIdToken: jest.fn((token) => {
            if (token === 'valid-token') {
                return Promise.resolve({
                    uid: 'test-uid',
                    email: 'test@example.com',
                    name: 'Test User'
                });
            }
            throw new Error('Invalid token');
        })
    }))
}));

describe('POST /api/auth/register', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    afterAll(async () => {
        await User.deleteMany({ email: 'test@example.com' });
        // await mongoose.connection.close(); // Don't close global connection if others use it
    });

    it('should register a new user successfully', async () => {
        const req = createTestRequest({
            method: 'POST',
            body: {
                idToken: 'valid-token',
                displayName: 'Test User',
                role: 'creator',
            },
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.message).toContain('successfully');
        expect(data.user.email).toBe('test@example.com');
    });

    it('should reject registration with invalid token', async () => {
        const req = createTestRequest({
            method: 'POST',
            body: {
                idToken: 'invalid-token',
                displayName: 'Test User',
                role: 'creator',
            },
        });

        const response = await POST(req);
        expect(response.status).toBe(401);
    });

    it('should sanitize input', async () => {
        const req = createTestRequest({
            method: 'POST',
            body: {
                idToken: 'valid-token',
                displayName: '<script>alert("xss")</script>Test User',
                role: 'creator',
            },
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.user.displayName).not.toContain('<script>');
    });
});
