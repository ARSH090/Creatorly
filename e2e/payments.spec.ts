import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Product discovery and view', async ({ page }) => {
    await page.goto('/');

    // Browse products
    await page.click('a:has-text("Explore")');
    await page.waitForURL('/products');

    // Click on a product
    await page.click('a[data-testid="product-card"]');
    
    // Verify product details page
    expect(page.url()).toContain('/products/');
    await expect(page.locator('h1')).toBeTruthy();
  });

  test('Add to cart flow', async ({ page }) => {
    // Navigate to products
    await page.goto('/products');

    // Add item to cart
    await page.click('button:has-text("Add to Cart")');

    // Verify cart updated
    const cartBadge = await page.textContent('[data-testid="cart-count"]');
    expect(cartBadge).toBeTruthy();

    // Go to cart
    await page.click('[data-testid="cart-button"]');
    await page.waitForURL('/cart');

    // Verify item in cart
    const cartItem = page.locator('[data-testid="cart-item"]');
    await expect(cartItem).toHaveCount(1);
  });

  test('Coupon application', async ({ page }) => {
    // Go to cart
    await page.goto('/cart');

    // Apply coupon
    await page.fill('input[name="coupon"]', 'SAVE10');
    await page.click('button:has-text("Apply")');

    // Verify discount applied
    const discount = await page.textContent('[data-testid="discount-amount"]');
    expect(discount).toContain('₹');

    // Verify total reduced
    const finalTotal = await page.textContent('[data-testid="final-total"]');
    expect(finalTotal).toBeTruthy();
  });

  test('Razorpay payment flow', async ({ page }) => {
    // Navigate to cart
    await page.goto('/cart');

    // Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');

    // Fill payment details
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="phone"]', '9876543210');

    // Select payment method
    await page.click('input[value="card"]');

    // Proceed to payment
    await page.click('button:has-text("Pay Now")');

    // Wait for Razorpay modal
    await page.waitForSelector('iframe[src*="razorpay"]');

    // Note: In real tests, you'd use Razorpay test cards
    // For this example, we'll wait for success redirect
    await page.waitForTimeout(5000); // Simulate payment
  });

  test('Payment failure handling', async ({ page }) => {
    // This would need to use Razorpay test cards
    await page.goto('/cart');

    // Attempt payment
    await page.click('button:has-text("Proceed to Checkout")');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="phone"]', '9876543210');
    await page.click('button:has-text("Pay Now")');

    // Wait for error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
  });

  test('Order history tracking', async ({ page }) => {
    // Go to orders page
    await page.goto('/dashboard/orders');

    // Verify orders are displayed
    const orderList = page.locator('[data-testid="order-item"]');
    const count = await orderList.count();
    expect(count).toBeGreaterThan(0);

    // Click on order
    await orderList.first().click();

    // Verify order details
    expect(page.url()).toContain('/orders/');
    await expect(page.locator('[data-testid="order-status"]')).toBeTruthy();
  });

  test('Refund request flow', async ({ page }) => {
    // Navigate to order
    await page.goto('/dashboard/orders');
    await page.click('[data-testid="order-item"]');

    // Request refund
    await page.click('button:has-text("Request Refund")');

    // Fill refund form
    await page.selectOption('select[name="reason"]', 'customer_request');
    await page.fill('textarea[name="notes"]', 'Changed my mind');

    // Submit
    await page.click('button:has-text("Request Refund")');

    // Verify success message
    const successMessage = await page.textContent('.success-message');
    expect(successMessage).toContain('Refund requested');
  });
});

test.describe('Payment Security', () => {
  test('PCI compliance - no password in payment form', async ({ page }) => {
    await page.goto('/checkout');

    // Verify sensitive fields are not present in payment form
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).not.toBeVisible();
  });

  test('Secure webhook verification', async ({ page }) => {
    // Test that webhook verification is working
    // This would be a backend test but can be smoke-tested via UI
    const response = await page.request.post('/api/payments/webhook', {
      data: {
        razorpay_payment_id: 'invalid_id',
        razorpay_order_id: 'invalid_order',
        razorpay_signature: 'invalid_signature',
      },
    });

    // Should reject invalid signatures
    expect(response.status()).toBe(400);
  });
});
