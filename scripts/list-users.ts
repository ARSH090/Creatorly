import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listUsers() {
    try {
        const { connectToDatabase } = await import('../src/lib/db/mongodb');
        const { User } = await import('../src/lib/models/User');

        await connectToDatabase();
        const users = await User.find({}).select('email username role').limit(10).lean();
        console.log('--- Current Users in DB ---');
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
}

listUsers();
