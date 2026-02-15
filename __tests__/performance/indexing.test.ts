import Product from '@/lib/models/Product';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

describe('Database Indexing Performance', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    it('should use index for creatorId queries', async () => {
        const creatorId = new mongoose.Types.ObjectId();

        // Explain the query
        const explain = await Product.find({ creatorId }).explain();

        // Check if it uses an index (IXSCAN) vs collection scan (COLLSCAN)
        const winningPlan = explain.queryPlanner.winningPlan;
        const isIndexScan = JSON.stringify(winningPlan).includes('IXSCAN');

        expect(isIndexScan).toBe(true);
    });
});
