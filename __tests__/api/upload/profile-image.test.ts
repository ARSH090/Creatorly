import { POST } from '@/app/api/upload/profile-image/route';
import { authenticatedRequest } from '@/tests/utils/api-test-utils';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

// Mock AWS S3
jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({})
    })),
    PutObjectCommand: jest.fn()
}));

describe('POST /api/upload/profile-image', () => {
    let testUser: any;

    beforeAll(async () => {
        await connectToDatabase();
        testUser = await User.findOneAndUpdate(
            { email: 'upload@test.com' },
            { firebaseUid: 'up-uid', displayName: 'Uploader', role: 'creator' },
            { upsert: true, new: true }
        );
    });

    it('should reject oversized files', async () => {
        // Large "file" mock
        const formData = new FormData();
        formData.append('file', new Blob([new Uint8Array(6 * 1024 * 1024)]), 'big.jpg');

        const req = await authenticatedRequest({
            method: 'POST',
            userId: testUser._id.toString(),
            body: formData,
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
        const formData = new FormData();
        formData.append('file', new Blob([new Uint8Array(1024)]), 'small.jpg');

        const req = {
            method: 'POST',
            body: formData,
            headers: new Headers()
        } as any; // Simple mock

        const response = await POST(req);
        expect(response.status).toBe(401);
    });
});
