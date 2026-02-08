import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('User registration flow', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill registration form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="username"]', 'newuser123');
    await page.fill('input[name="displayName"]', 'New User');
    await page.fill('input[name="password"]', 'SecurePassword123');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to login or verification
    await page.waitForURL(/\/(auth\/(login|verify-email)|dashboard)/);

    // Verify user was created
    const url = page.url();
    expect(url).toMatch(/\/(auth\/(login|verify-email)|dashboard)/);
  });

  test('User login flow', async ({ page, context }) => {
    await page.goto('/auth/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Verify authentication cookie is set
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token');
    expect(sessionCookie).toBeTruthy();
  });

  test('Password reset flow', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    // Enter email
    await page.fill('input[name="email"]', 'test@example.com');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for confirmation message
    const message = await page.textContent('.success-message');
    expect(message).toContain('reset link');
  });

  test('Logout functionality', async ({ page, context }) => {
    // First login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('/dashboard');

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Should be redirected to login
    await page.waitForURL('/auth/login');

    // Session cookie should be cleared
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token');
    expect(sessionCookie).toBeUndefined();
  });
});

test.describe('Authentication Security', () => {
  test('Weak password rejection', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="username"]', 'user123');
    await page.fill('input[name="displayName"]', 'User');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');

    await page.click('button[type="submit"]');

    // Should show error
    const error = await page.textContent('.error-message');
    expect(error).toContain('Password must be at least 8 characters');
  });

  test('Protected routes redirect to login', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('Rate limiting on login attempts', async ({ page }) => {
    // Try multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(200);
    }

    // Should be rate limited
    const errorMessage = await page.textContent('.error-message');
    expect(errorMessage).toContain('too many attempts');
  });
});
