import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validatePriceChange } from '../lib/middleware/subscriptionMiddleware';
import { PlanTier } from '../lib/models/plan.types';

describe('Subscription Logic Validation', () => {
    it('should prevent converting free plan to paid when subscribers exist', async () => {
        const oldPlan = { tier: PlanTier.FREE, monthlyPrice: 0 };
        const newPlan = { tier: PlanTier.BASIC, monthlyPrice: 199 };

        await expect(validatePriceChange(oldPlan, newPlan, 1)).rejects.toThrow('Cannot convert free plan to paid');
    });

    it('should prevent price increase > 10% when active subscribers exist', async () => {
        const oldPlan = { tier: PlanTier.BASIC, monthlyPrice: 100 };
        const newPlan = { tier: PlanTier.BASIC, monthlyPrice: 111 }; // 11% increase

        await expect(validatePriceChange(oldPlan, newPlan, 5)).rejects.toThrow('Price increase limited to 10%');
    });

    it('should allow price increase <= 10% when active subscribers exist', async () => {
        const oldPlan = { tier: PlanTier.BASIC, monthlyPrice: 100 };
        const newPlan = { tier: PlanTier.BASIC, monthlyPrice: 110 }; // 10% increase

        await expect(validatePriceChange(oldPlan, newPlan, 5)).resolves.not.toThrow();
    });

    it('should prevent removing critical features when active subscribers exist', async () => {
        const oldPlan = { tier: PlanTier.PRO, hasAnalytics: true, monthlyPrice: 499 };
        const newPlan = { tier: PlanTier.PRO, hasAnalytics: false, monthlyPrice: 499 };

        await expect(validatePriceChange(oldPlan, newPlan, 10)).rejects.toThrow('Cannot remove feature');
    });
});
