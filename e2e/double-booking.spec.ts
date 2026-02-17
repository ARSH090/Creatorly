import { test, expect } from '@playwright/test';

/**
 * E2E Test: Double booking prevention
 * Tests race condition handling for booking same time slot
 */
test.describe('Double Booking Prevention', () => {

    test('concurrent booking attempts - only one succeeds', async ({ browser }) => {
        // Create two separate browser contexts (simulating two users)
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();

        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        const targetSlot = '2026-03-01T10:00:00Z'; // Same time slot

        try {
            // Both users navigate to booking page
            await Promise.all([
                page1.goto('/store/testcreator/book'),
                page2.goto('/store/testcreator/book'),
            ]);

            // Both users select the same time slot
            await Promise.all([
                page1.click(`[data-slot-time="${targetSlot}"]`),
                page2.click(`[data-slot-time="${targetSlot}"]`),
            ]);

            // Both click "Book Now" simultaneously
            const [response1, response2] = await Promise.all([
                page1.waitForResponse(resp => resp.url().includes('/api/bookings')),
                page2.waitForResponse(resp => resp.url().includes('/api/bookings')),
                page1.click('button:has-text("Confirm Booking")'),
                page2.click('button:has-text("Confirm Booking")'),
            ]);

            // One should succeed (201), one should fail (409)
            const statuses = [response1.status(), response2.status()].sort();
            expect(statuses).toEqual([201, 409]);

            // Verify success message on one page
            const hasSuccess1 = await page1.locator('text=Booking confirmed').isVisible().catch(() => false);
            const hasSuccess2 = await page2.locator('text=Booking confirmed').isVisible().catch(() => false);

            // Exactly one should show success
            expect(hasSuccess1 !== hasSuccess2).toBe(true);

            // Verify error message on the other page
            const hasError1 = await page1.locator('text=already booked').isVisible().catch(() => false);
            const hasError2 = await page2.locator('text=already booked').isVisible().catch(() => false);

            // Exactly one should show error
            expect(hasError1 !== hasError2).toBe(true);

            // Verify database has exactly one booking for this slot
            // (This would require checking via API or dashboard)

        } finally {
            await context1.close();
            await context2.close();
        }
    });

    test('booking shows as unavailable immediately after first booking', async ({ page }) => {
        const targetSlot = '2026-03-01T11:00:00Z';

        // Book the slot
        await page.goto('/store/testcreator/book');
        await page.click(`[data-slot-time="${targetSlot}"]`);
        await page.click('button:has-text("Confirm Booking")');
        await expect(page.locator('text=Booking confirmed')).toBeVisible();

        // Refresh availability
        await page.reload();

        // Previously booked slot should NOT be clickable/selectable
        const slotElement = page.locator(`[data-slot-time="${targetSlot}"]`);
        await expect(slotElement).toHaveAttribute('disabled', '');
        // OR
        await expect(slotElement).toHaveClass(/booked|unavailable/);
    });
});
