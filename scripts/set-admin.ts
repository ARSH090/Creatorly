// scripts/set-admin.ts
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// We need to register tsconfig-paths to resolve @/ imports if we were using them directly
// But for simplicity in this script, we'll try to use relative imports or rely on the project config

// To avoid import issues with @/ in the models/db files when running via ts-node without explicit path registration,
// we will implement a minimal connection and model definition locally for this script.
// This is often more robust for standalone scripts than trying to load the entire Next.js app context.

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

// Define minimal User schema for the script
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, default: 'user' },
}, { strict: false }); // strict: false allows us to update role even if other fields exist that we don't define here

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function setAdminRole(email: string) {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI as string);
        console.log('✅ Connected.');

        console.log(`🔍 Searching for user: ${email}...`);
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ Error: No user found with email: ${email}`);
            console.log(`\nPlease sign up with this email first at /auth/login, then run this script.`);
            process.exit(1);
        }

        console.log(`👤 Found user: ${user._id} (Current Role: ${user.role})`);

        user.role = 'admin';
        await user.save();

        console.log(`\n✅ Successfully granted ADMIN role to: ${email}`);
        console.log(`\nThe user can now access the admin dashboard at /admin`);

        process.exit(0);
    } catch (error: any) {
        console.error(`❌ Error setting admin role:`, error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Get email from command line arguments
const targetEmail = process.argv[2];

if (!targetEmail) {
    console.error('❌ Error: Please provide an email address');
    console.log('\nUsage: npx ts-node scripts/set-admin.ts your-email@example.com');
    process.exit(1);
}

setAdminRole(targetEmail);
