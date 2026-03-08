
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkUserStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        const user = await db.collection('users').findOne({ email: 'free@creatorly.test' });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User subscriptionTier:', user.subscriptionTier);
        console.log('User planLimits:', user.planLimits);

        const productCount = await db.collection('products').countDocuments({ creatorId: user._id });
        console.log('Product count:', productCount);

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

checkUserStats();
