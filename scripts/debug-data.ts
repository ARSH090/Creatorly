
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkData() {
    try {
        const { connectToDatabase } = await import('../src/lib/db/mongodb');
        const { Product } = await import('../src/lib/models/Product');
        const { User } = await import('../src/lib/models/User');

        await connectToDatabase();
        const users = await User.find({}).select('email username').lean();
        console.log('Users:', JSON.stringify(users, null, 2));

        const productCount = await Product.countDocuments();
        console.log(`Product Count: ${productCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
