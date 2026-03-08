
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function findProductOwner() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const product = await mongoose.connection.db.collection('products').findOne({});
        if (!product) {
            console.log('No products found');
            return;
        }
        const user = await mongoose.connection.db.collection('users').findOne({ _id: product.creatorId });
        console.log('Product owner:', JSON.stringify(user, null, 2));
        const products = await mongoose.connection.db.collection('products').find({ creatorId: user._id }).toArray();
        console.log('Products:', JSON.stringify(products.map(p => ({ title: p.title, slug: p.slug })), null, 2));
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
findProductOwner();
