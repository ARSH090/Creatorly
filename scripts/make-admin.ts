import { connectToDatabase } from '../src/lib/db/mongodb';
import { User } from '../src/lib/models/User';
import mongoose from 'mongoose';

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address as an argument.');
    process.exit(1);
}

async function makeAdmin() {
    try {
        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        // Ensure necessary permissions are set if applicable, though role usually suffices
        if (!user.permissions) user.permissions = [];
        if (!user.permissions.includes('admin_access')) user.permissions.push('admin_access');

        await user.save();

        console.log(`Successfully promoted ${user.email} (Username: ${user.username}) to ADMIN.`);
        console.log('You can now access the admin panel at /admin/dashboard');

    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

makeAdmin();
