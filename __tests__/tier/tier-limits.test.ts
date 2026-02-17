import { checkFeatureAccess } from '@/lib/middleware/checkFeatureAccess';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import Product from '@/lib/models/Product';

describe('Tier Limits - Feature Gates', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    describe('Test 1: Free tier product limit (1 max)', () => {
        it('should allow creating 1 product on free tier', async () => {
            // Create a free tier user
            const user = await User.create({
                email: 'test-free@example.com',
                username: 'testfree',
                clerkId: 'clerk_test_free',
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: '127.0.0.1',
                phoneVerified: false,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            // Check if user can create 1st product
            const check1 = await checkFeatureAccess(user._id.toString(), 'products', 0);
            expect(check1.allowed).toBe(true);

            // Create 1 product
            await Product.create({
                creatorId: user._id,
                name: 'Test Product 1',
                slug: 'test-product-1',
                price: 1000,
                currency: 'INR',
                status: 'published',
                type: 'digital'
            });

            // Try to create 2nd product - should fail
            const check2 = await checkFeatureAccess(user._id.toString(), 'products', 1);
            expect(check2.allowed).toBe(false);
            expect(check2.errorCode).toBe('FEATURE_GATE_PRODUCTS');
            expect(check2.limit).toBe(1);
            expect(check2.upgradeUrl).toContain('/pricing');

            // Cleanup
            await User.findByIdAndDelete(user._id);
            await Product.deleteMany({ creatorId: user._id });
        });

        it('should allow unlimited products on creator tier', async () => {
            const user = await User.create({
                email: 'test-creator@example.com',
                username: 'testcreator',
                clerkId: 'clerk_test_creator',
                subscriptionTier: 'creator',
                subscriptionStatus: 'active',
                signupIp: '127.0.0.1',
                phoneVerified: true,
                freeTierOrdersCount: 0,
                freeTierLeadsCount: 0
            });

            // Check if user can create 10 products
            const check = await checkFeatureAccess(user._id.toString(), 'products', 10);
            expect(check.allowed).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
        });
    });

    describe('Test 7: Platform fee calculation', () => {
        it('should calculate 10% fee for free tier', async () => {
            const { calculatePlatformFee } = await import('@/lib/utils/tier-utils');

            const result = calculatePlatformFee(10000, 'free');
            expect(result.feePercent).toBe(10);
            expect(result.platformFee).toBe(1000);
            expect(result.creatorPayout).toBe(9000);
        });

        it('should calculate 2% fee for creator tier', async () => {
            const { calculatePlatformFee } = await import('@/lib/utils/tier-utils');

            const result = calculatePlatformFee(10000, 'creator');
            expect(result.feePercent).toBe(2);
            expect(result.platformFee).toBe(200);
            expect(result.creatorPayout).toBe(9800);
        });

        it('should calculate 0% fee for pro tier', async () => {
            const { calculatePlatformFee } = await import('@/lib/utils/tier-utils');

            const result = calculatePlatformFee(10000, 'pro');
            expect(result.feePercent).toBe(0);
            expect(result.platformFee).toBe(0);
            expect(result.creatorPayout).toBe(10000);
        });
    });

    describe('Test 8: Lifetime order cap enforcement', () => {
        it('should block new orders after 50 lifetime orders on free tier', async () => {
            const user = await User.create({
                email: 'test-orders@example.com',
                username: 'testorders',
                clerkId: 'clerk_test_orders',
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: '127.0.0.1',
                phoneVerified: false,
                freeTierOrdersCount: 50, // At limit
                freeTierLeadsCount: 0
            });

            const check = await checkFeatureAccess(user._id.toString(), 'ordersLifetime');
            expect(check.allowed).toBe(false);
            expect(check.limit).toBe(50);
            expect(check.current).toBe(50);

            // Cleanup
            await User.findByIdAndDelete(user._id);
        });

        it('should allow orders at 49 lifetime count', async () => {
            const user = await User.create({
                email: 'test-orders-49@example.com',
                username: 'testorders49',
                clerkId: 'clerk_test_orders_49',
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                signupIp: '127.0.0.1',
                phoneVerified: false,
                freeTierOrdersCount: 49,
                freeTierLeadsCount: 0
            });

            const check = await checkFeatureAccess(user._id.toString(), 'ordersLifetime');
            expect(check.allowed).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
        });
    });
});
