
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function debugProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const products = await mongoose.connection.db.collection('products').find({}).toArray();
        console.log('Total products:', products.length);
        products.forEach(p => {
            console.log(`- Title: ${p.title}, Slug: ${p.slug}, CreatorId: ${p.creatorId}`);
        });
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
debugProducts();
