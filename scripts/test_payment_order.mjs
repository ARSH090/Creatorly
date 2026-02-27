import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Schema, model } from 'mongoose';

dotenv.config({ path: '.env.local' });

// Mock models for simple verification
const orderSchema = new Schema({}, { strict: false });
const Order = mongoose.models.Order || model('Order', orderSchema, 'orders');

const productSchema = new Schema({}, { strict: false });
const Product = mongoose.models.Product || model('Product', productSchema, 'products');

const TEST_PRODUCT_ID = '699ef37e06ffffd795240fee';
const CREATOR_ID = '699ef37e06ffffd795240fed';
const TEST_USER_ID = '699ef37e06ffffd795240fed'; // Mocking use of a user

async function simulateOrderCreation() {
    await mongoose.connect(process.env.MONGODB_URI);

    const product = await Product.findById(TEST_PRODUCT_ID);
    if (!product) {
        console.error('Product not found');
        process.exit(1);
    }

    const orderData = {
        items: [{
            productId: product._id,
            name: product.title || product.name,
            price: product.pricing?.basePrice || product.price,
            quantity: 1,
            type: product.productType || product.type
        }],
        creatorId: product.creatorId,
        userId: TEST_USER_ID,
        customerEmail: 'test-student@creatorly.in',
        amount: product.pricing?.basePrice || product.price,
        currency: product.pricing?.currency || product.currency || 'INR',
        razorpayOrderId: 'order_test_' + Date.now(),
        status: 'pending'
    };

    const order = await Order.create(orderData);
    console.log('ORDER_CREATED_ID=' + order._id);
    console.log('RAZORPAY_ORDER_ID=' + order.razorpayOrderId);

    await mongoose.disconnect();
}

simulateOrderCreation().catch(console.error);
