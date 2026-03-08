const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        console.log('Migrating status: active to published...');
        const result1 = await db.collection('products').updateMany(
            { status: 'active' },
            { $set: { status: 'published' } }
        );
        console.log('Migrated active products to published:', result1.modifiedCount);

        console.log('Migrating isActive:true to status:published...');
        const result2 = await db.collection('products').updateMany(
            { isActive: true },
            { $set: { status: 'published' } }
        );
        console.log('Updated isActive:true products to published:', result2.modifiedCount);

        await mongoose.disconnect();
        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrate();
