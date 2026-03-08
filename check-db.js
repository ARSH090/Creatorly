
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await mongoose.connection.db.collection('users').find({
            email: { $in: ['admin@creatorly.test', 'pro@creatorly.test', 'free@creatorly.test'] }
        }).toArray();
        console.log('Found users:', JSON.stringify(users, null, 2));

        const plans = await mongoose.connection.db.collection('plans').find({}).toArray();
        console.log('Found plans:', JSON.stringify(plans, null, 2));

        const products = await mongoose.connection.db.collection('products').countDocuments();
        const orders = await mongoose.connection.db.collection('orders').countDocuments();
        console.log('Products count:', products);
        console.log('Orders count:', orders);

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDB();
