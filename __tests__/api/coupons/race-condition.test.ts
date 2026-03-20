import { connectToDatabase } from '@/lib/db/mongodb';
import { Coupon } from '@/lib/models/Coupon';
import { Order } from '@/lib/models/Order';

describe('Coupon Race Condition Test', () => {
    it('should not allow coupon usage beyond maxLimit under concurrent requests', async () => {
        const couponCode = 'LIMITED10';
        
        // Mock coupon with limit: 1, current: 0
        const mockCoupon = {
            _id: 'coupon_123',
            code: couponCode,
            maxUsage: 1,
            usedCount: 0,
            status: 'active',
            save: jest.fn(),
        };

        // Simulate 5 simultaneous requests for the same coupon
        const requests = Array(5).fill(null).map(async () => {
            // This represents the logic inside the checkout API
            // It MUST use findOneAndUpdate with $inc and a guard: { usedCount: { $lt: maxUsage } }
            return await Coupon.findOneAndUpdate(
                { code: couponCode, usedCount: { $lt: 1 }, status: 'active' },
                { $inc: { usedCount: 1 } },
                { new: true }
            );
        });

        const results = await Promise.all(requests);
        const successfulUses = results.filter(r => r !== null);

        // Only 1 request should have succeeded
        expect(successfulUses.length).toBe(1);
    });
});
