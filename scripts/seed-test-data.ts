import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

async function seedTestData() {
    try {
        const { connectToDatabase } = await import('../src/lib/db/mongodb');
        const { User } = await import('../src/lib/models/User');
        const { Product } = await import('../src/lib/models/Product');

        await connectToDatabase();

        // 1. Create Test Creator
        const creator = await User.findOneAndUpdate(
            { email: 'test-creator@creatorly.in' },
            {
                username: 'testcreator',
                role: 'creator',
                password: 'hashed_password_here',
                isSuspended: false
            },
            { upsert: true, new: true }
        );

        // 2. Create Test Product
        await Product.findOneAndUpdate(
            { title: 'Test Ebook', creatorId: creator._id },
            {
                price: 1000, // $10.00
                type: 'ebook',
                fileUrl: 'https://test-bucket.s3.amazonaws.com/ebook.pdf',
                description: 'This is a test product for automated QA.'
            },
            { upsert: true }
        );

        console.log('✅ Test data fixtures seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fixture seeding failed:', error);
        process.exit(1);
    }
}

seedTestData();
