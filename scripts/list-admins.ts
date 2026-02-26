import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function listAdmins() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        const UserSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const admins = await User.find({ role: { $in: ['admin', 'super-admin'] } }).limit(5);

        console.log('--- ADMIN USERS ---');
        admins.forEach(admin => {
            console.log(`Email: ${admin.email}, ID: ${admin._id}, Role: ${admin.role}`);
        });
        console.log('-------------------');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listAdmins();
