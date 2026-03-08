
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function listProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({ username: 'mdarsheqbal' });
        if (!user) {
            console.log('User mdarsheqbal not found');
            return;
        }
        const products = await mongoose.connection.db.collection('products').find({ creatorId: user._id }).toArray();
        console.log('Products:', JSON.stringify(products.map(p => ({ title: p.title, slug: p.slug })), null, 2));
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
listProducts();
