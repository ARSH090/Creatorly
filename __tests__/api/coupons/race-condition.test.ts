import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    const { Coupon } = await import('@/lib/models/Coupon');
    await Coupon.deleteMany({});
});

describe('Coupon race condition — atomic $inc guard', () => {
    it('allows at most usageLimit redemptions under 10 concurrent requests', async () => {
        const { Coupon } = await import('@/lib/models/Coupon');

        const coupon = await Coupon.create({
            code: 'RACETEST',
            creatorId: new mongoose.Types.ObjectId(),
            discountType: 'percentage',
            discountValue: 20,
            usageLimit: 3,
            usedCount: 0,
            isActive: true,
            status: 'active',
            validFrom: new Date('2020-01-01'),
        });

        // 10 concurrent redemption attempts against a limit of 3
        const results = await Promise.all(
            Array.from({ length: 10 }, () =>
                Coupon.findOneAndUpdate(
                    { _id: coupon._id, $expr: { $lt: ['$usedCount', '$usageLimit'] } },
                    { $inc: { usedCount: 1 } },
                    { new: true }
                )
            )
        );

        const successful = results.filter(Boolean).length;
        const final = await Coupon.findById(coupon._id);

        expect(successful).toBeLessThanOrEqual(3);
        expect(final?.usedCount).toBeLessThanOrEqual(3);
        expect(final?.usedCount).toBe(successful); // DB count matches successful updates
    });
});
