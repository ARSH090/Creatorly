
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function seedTestAccounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        const testUsers = [
            {
                email: 'admin@creatorly.test',
                username: 'admin_test',
                displayName: 'Admin Tester',
                role: 'admin',
                subscriptionTier: 'pro',
                subscriptionStatus: 'active',
                onboardingComplete: true,
                status: 'active'
            },
            {
                email: 'pro@creatorly.test',
                username: 'pro_creator',
                displayName: 'Pro Creator Tester',
                role: 'creator',
                subscriptionTier: 'pro',
                subscriptionStatus: 'active',
                onboardingComplete: true,
                status: 'active'
            },
            {
                email: 'free@creatorly.test',
                username: 'free_creator',
                displayName: 'Free Creator Tester',
                role: 'creator',
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                onboardingComplete: true,
                status: 'active'
            }
        ];

        for (const userData of testUsers) {
            const existing = await db.collection('users').findOne({ email: userData.email });
            if (!existing) {
                userData.createdAt = new Date();
                userData.updatedAt = new Date();
                const result = await db.collection('users').insertOne(userData);
                console.log(`Created user: ${userData.email} with ID: ${result.insertedId}`);
            } else {
                console.log(`User ${userData.email} already exists`);
            }
        }

        // Reassign products to test users
        const proUser = await db.collection('users').findOne({ email: 'pro@creatorly.test' });
        const freeUser = await db.collection('users').findOne({ email: 'free@creatorly.test' });

        if (proUser && freeUser) {
            const products = await db.collection('products').find({}).toArray();
            if (products.length >= 2) {
                await db.collection('products').updateOne({ _id: products[0]._id }, { $set: { creatorId: proUser._id, status: 'published' } });
                await db.collection('products').updateOne({ _id: products[1]._id }, { $set: { creatorId: proUser._id, status: 'published' } });
                await db.collection('products').updateOne({ _id: products[2]._id }, { $set: { creatorId: proUser._id, status: 'published' } });
                await db.collection('products').updateOne({ _id: products[3]._id }, { $set: { creatorId: freeUser._id, status: 'published' } });
                console.log('Reassigned 4 products to pro/free users');
            }
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

seedTestAccounts();
