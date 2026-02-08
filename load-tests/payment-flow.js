import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const paymentLatency = new Trend('payment_latency');
export const checkoutLatency = new Trend('checkout_latency');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 50 }, // Ramp down to 50 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    'errors': ['rate<0.1'], // Error rate should be less than 10%
    'payment_latency': ['p(95)<500', 'p(99)<1000'], // 95th percentile < 500ms
    'checkout_latency': ['p(95)<1000', 'p(99)<2000'], // 95th percentile < 1000ms
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://creatorly.app';

// Test user data
const testUsers = [
  { email: 'test1@example.com', password: 'TestPassword123' },
  { email: 'test2@example.com', password: 'TestPassword123' },
  { email: 'test3@example.com', password: 'TestPassword123' },
];

export default function () {
  // Get random test user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Scenario 1: Customer browsing products
  browsProducts();

  // Scenario 2: Customer checkout and payment
  checkoutAndPayment(user);

  sleep(1);
}

function browsProducts() {
  const res = http.get(`${BASE_URL}/api/products`);
  check(res, {
    'products list status is 200': (r) => r.status === 200,
    'products list has data': (r) => r.json('products') !== undefined,
  }) || errorRate.add(1);
}

function checkoutAndPayment(user) {
  // Step 1: Create order
  const createOrderRes = http.post(`${BASE_URL}/api/payments/razorpay`, {
    productId: 'test-product-id',
    amount: 10000, // ₹100
    description: 'Test Product',
  });

  const orderData = check(createOrderRes, {
    'order creation status is 200': (r) => r.status === 200,
    'order has razorpay order id': (r) => r.json('razorpay_order_id') !== undefined,
  }) || errorRate.add(1);

  if (!orderData) return;

  const razorpayOrderId = createOrderRes.json('razorpay_order_id');
  checkoutLatency.add(createOrderRes.timings.duration);

  sleep(0.5);

  // Step 2: Verify payment (simulated)
  const verifyPaymentRes = http.post(
    `${BASE_URL}/api/payments/webhook`,
    {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: 'pay_test_' + Math.random().toString(36).substring(7),
      razorpay_signature: 'test_signature',
      email: user.email,
    }
  );

  check(verifyPaymentRes, {
    'payment verification status is 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);

  paymentLatency.add(verifyPaymentRes.timings.duration);

  sleep(1);
}

// Performance monitoring
export function handleSummary(data) {
  return {
    'summary.json': data,
  };
}
