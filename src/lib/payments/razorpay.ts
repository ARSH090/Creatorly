import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder';

export const razorpay = new Razorpay({
    key_id,
    key_secret,
});
