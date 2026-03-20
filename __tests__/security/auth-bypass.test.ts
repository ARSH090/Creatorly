import { createMocks } from 'node-mocks-http';
import { GET as adminOrdersHandler } from '@/app/api/admin/orders/route';
import { currentUser } from '@clerk/nextjs/server';

jest.mock('@clerk/nextjs/server');

describe('Admin Auth Bypass Security Test', () => {
    it('should reject non-admin users from accessing admin routes', async () => {
        // Mock a regular user (not admin)
        (currentUser as jest.Mock).mockResolvedValue({
            id: 'user_123',
            publicMetadata: { role: 'user' } // Not admin
        });

        const { req } = createMocks({ method: 'GET' });
        
        const response = await adminOrdersHandler(req as any);
        
        // Should return 401 or 403
        expect([401, 403]).toContain(response.status);
    });

    it('should reject unauthenticated requests', async () => {
        (currentUser as jest.Mock).mockResolvedValue(null);

        const { req } = createMocks({ method: 'GET' });
        const response = await adminOrdersHandler(req as any);
        
        expect(response.status).toBe(401);
    });
});
