import { createClerkClient } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY is not defined in .env.local');
    process.exit(1);
}

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

async function promoteToAdmin(email: string) {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI as string);
        console.log('✅ Connected.');

        // 1. Update MongoDB Role
        // Using a dynamic model definition to avoid conflict with existing app models
        const UserSchema = new mongoose.Schema({
            email: { type: String, required: true },
            role: String,
            clerkId: String,
        }, { strict: false });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User not found in MongoDB with email: ${email}`);
            console.log('Please register at /auth/register first.');
            process.exit(1);
        }

        console.log(`👤 Found user: ${user._id} (Role: ${user.role}, ClerkID: ${user.clerkId})`);

        user.role = 'admin';
        await user.save();
        console.log('✅ MongoDB role updated to admin.');

        // 2. Update Clerk Metadata
        if (user.clerkId) {
            console.log(`🔐 Updating Clerk metadata for user ${user.clerkId}...`);
            await clerk.users.updateUserMetadata(user.clerkId, {
                publicMetadata: {
                    role: 'admin'
                }
            });
            console.log('✅ Clerk publicMetadata updated.');
        } else {
            // Find in Clerk by email if clerkId not in DB
            console.log(`🔍 ClerkID missing in DB. Searching Clerk by email: ${email}...`);
            const clerkUsers = await clerk.users.getUserList({ emailAddress: [email] });
            const clerkUser = clerkUsers.data[0];

            if (clerkUser) {
                console.log(`🔐 Found Clerk user: ${clerkUser.id}. Updating metadata...`);
                await clerk.users.updateUserMetadata(clerkUser.id, {
                    publicMetadata: {
                        role: 'admin'
                    }
                });

                // Also update DB with clerkId if it was missing
                user.clerkId = clerkUser.id;
                await user.save();
                console.log('✅ Clerk publicMetadata updated and clerkId synced back to MongoDB.');
            } else {
                console.warn('⚠️ User not found in Clerk. Admin login might not work until the user registers in Clerk.');
            }
        }

        console.log('\n✨ SUCCESS: User is now an ADMIN.');
        console.log('You can now access the admin panel at: https://creatorly.in/admin');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error promoting user:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

const targetEmail = process.argv[2];
if (!targetEmail) {
    console.error('Usage: npx ts-node scripts/promote-admin.ts <email>');
    process.exit(1);
}

promoteToAdmin(targetEmail);
