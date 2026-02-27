import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Using direct paths because of MJS execution context
import { Schema, model } from 'mongoose';

dotenv.config({ path: '.env.local' });

const productSchema = new Schema({}, { strict: false });
const Product = mongoose.models.Product || model('Product', productSchema, 'products');

async function findTestData() {
    await mongoose.connect(process.env.MONGODB_URI);

    const product = await Product.findOne({ status: 'active' });
    if (product) {
        console.log('TEST_PRODUCT_ID=' + product._id);
        console.log('CREATOR_ID=' + product.creatorId);
    } else {
        // Try any product if no active one exists
        const anyProduct = await Product.findOne({});
        if (anyProduct) {
            console.log('TEST_PRODUCT_ID=' + anyProduct._id);
            console.log('CREATOR_ID=' + anyProduct.creatorId);
        } else {
            console.log('No products found.');
        }
    }

    await mongoose.disconnect();
}

findTestData().catch(console.error);
