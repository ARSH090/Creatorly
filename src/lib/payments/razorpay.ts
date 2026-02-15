import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined');
    }
    console.warn('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are missing. Payment features will fail.');
}

export const razorpay = new Razorpay({
    key_id: key_id || 'rzp_test_placeholder',
    key_secret: key_secret || 'placeholder',
});
