import mongoose from 'mongoose';
import User from '../src/lib/models/User';
import Product from '../src/lib/models/Product';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const TEST_USER_ID = "65db8d9f1234567890abcdef";

        // 1. Refresh Test User
        await User.deleteMany({ $or: [{ email: "test@creatorly.in" }, { clerkId: "user_test_123" }] });
        const user = await User.create({
            _id: TEST_USER_ID,
            clerkId: "user_test_123",
            firebaseUid: "test_firebase_uid_123",
            email: "test@creatorly.in",
            username: "testcreator",
            displayName: "Test Creator",
            role: "creator",
            emailVerified: true,
            subscriptionTier: "pro",
            subscriptionStatus: "active",
            onboardingComplete: true
        });

        console.log("✅ Test user seeded:", user.username, "(ID:", user._id, ")");

        // 2. Clear existing test products
        await Product.deleteMany({ creatorId: user._id });

        // 3. Create a Test Product
        const product = await Product.create({
            _id: new mongoose.Types.ObjectId(),
            name: "Ultimate Creator Bundle",
            slug: "ultimate-creator-bundle",
            title: "Ultimate Creator Bundle",
            description: "A bundle of high-quality digital assets for creators.",
            price: 499,
            pricing: {
                basePrice: 499,
                currency: "INR"
            },
            currency: "INR",
            status: "active",
            isActive: true,
            productType: "digital_download",
            creatorId: user._id,
            creatorUsername: user.username,
            published: true,
            isPublic: true
        });

        console.log('✅ Test product seeded:', product.title);
        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
