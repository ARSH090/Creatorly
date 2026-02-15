import { GET, POST } from '@/app/api/products/route';
import { createTestRequest, authenticatedRequest } from '@/tests/utils/api-test-utils';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

describe('Product API', () => {
    let creatorUser: any;

    beforeAll(async () => {
        await connectToDatabase();
        creatorUser = await User.findOneAndUpdate(
            { email: 'creator-prod@example.com' },
            {
                firebaseUid: 'creator-prod-uid',
                displayName: 'Prod Creator',
                role: 'creator',
            },
            { upsert: true, new: true }
        );
    });

    afterAll(async () => {
        await Product.deleteMany({ creatorId: creatorUser._id });
        await User.deleteOne({ _id: creatorUser._id });
    });

    it('should create product as draft', async () => {
        const req = await authenticatedRequest({
            method: 'POST',
            userId: creatorUser._id.toString(),
            role: 'creator',
            body: {
                title: 'New Product',
                description: 'Test Description',
                price: 999,
                category: 'ebooks',
                coverImageUrl: 'https://example.com/cover.jpg',
                fileUrl: 's3://bucket/test.pdf',
                fileName: 'test.pdf',
                fileSize: 1024,
                fileType: 'application/pdf'
            },
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.data.status).toBe('draft');
    });

    it('should only list published products for guests', async () => {
        // Create one published and one draft
        await Product.create([
            {
                creatorId: creatorUser._id,
                title: 'Published',
                status: 'published',
                price: 100,
                description: 'p',
                fileName: 'f',
                fileUrl: 'u',
                fileSize: 0,
                fileType: 't'
            },
            {
                creatorId: creatorUser._id,
                title: 'Draft',
                status: 'draft',
                price: 100,
                description: 'd',
                fileName: 'f',
                fileUrl: 'u',
                fileSize: 0,
                fileType: 't'
            }
        ]);

        const req = createTestRequest({ method: 'GET' });
        const response = await GET(req);
        const data = await response.json();

        const statuses = data.data.map((p: any) => p.status);
        expect(statuses).toContain('published');
        expect(statuses).not.toContain('draft');
    });
});
