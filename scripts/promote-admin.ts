import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedAdmin() {
    try {
        const { connectToDatabase } = await import('../src/lib/db/mongodb');
        const { User } = await import('../src/lib/models/User');

        await connectToDatabase();

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@creatorly.in';

        const existing = await User.findOne({ email: adminEmail });
        if (existing) {
            existing.role = 'super-admin';
            await existing.save();
            console.log('Admin user updated to super-admin:', adminEmail);
        } else {
            console.warn('User not found in DB:', adminEmail);
            const allUsers = await User.find({}).limit(5).lean();
            console.log('Sample users in DB:', allUsers.map(u => u.email));
        }

        process.exit(0);
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
}

seedAdmin();
