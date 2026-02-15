import { GET, PUT } from '@/app/api/users/[id]/route';
import { authenticatedRequest, createTestRequest } from '@/tests/utils/api-test-utils';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

describe('User API', () => {
    let testUser: any;

    beforeAll(async () => {
        await connectToDatabase();
        testUser = await User.findOneAndUpdate(
            { email: 'user@example.com' },
            {
                firebaseUid: 'user-uid',
                displayName: 'Test User',
                role: 'creator',
            },
            { upsert: true, new: true }
        );
    });

    afterAll(async () => {
        await User.deleteMany({ email: 'user@example.com' });
    });

    describe('GET /api/users/[id]', () => {
        it('should get user profile with valid auth', async () => {
            const req = await authenticatedRequest({
                method: 'GET',
                userId: testUser._id.toString(),
            });

            const response = await GET(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.email).toBe('user@example.com');
        });

        it('should reject access to other user profile', async () => {
            const req = await authenticatedRequest({
                method: 'GET',
                userId: 'different-user-id',
                role: 'customer',
            });

            const response = await GET(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
            expect(response.status).toBe(403);
        });

        it('should allow admin access to any user', async () => {
            const req = await authenticatedRequest({
                method: 'GET',
                userId: 'admin-user-id',
                role: 'admin',
            });

            const response = await GET(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
            expect(response.status).toBe(200);
        });
    });

    describe('PUT /api/users/[id]', () => {
        it('should update user profile', async () => {
            const req = await authenticatedRequest({
                method: 'PUT',
                userId: testUser._id.toString(),
                body: {
                    displayName: 'Updated Name',
                },
            });

            const response = await PUT(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.displayName).toBe('Updated Name');
        });

        it('should sanitize input', async () => {
            const req = await authenticatedRequest({
                method: 'PUT',
                userId: testUser._id.toString(),
                body: {
                    displayName: '<script>alert("xss")</script>Safe Name',
                },
            });

            const response = await PUT(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.displayName).not.toContain('<script>');
        });
    });
});
