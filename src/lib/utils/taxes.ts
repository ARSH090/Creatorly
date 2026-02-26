import TaxSetting from '@/lib/models/TaxSetting';

export async function calculateTax(creatorId: string, countryCode: string, amount: number) {
    try {
        const taxRule = await TaxSetting.findOne({
            creatorId,
            countryCode: countryCode.toUpperCase(),
            isActive: true
        });

        if (!taxRule) return { taxAmount: 0, taxRate: 0, total: amount, taxName: '' };

        let taxAmount = 0;
        let finalTotal = amount;

        if (taxRule.isInclusive) {
            // Price = Total / (1 + Rate)
            const basePrice = amount / (1 + (taxRule.taxRate / 100));
            taxAmount = amount - basePrice;
        } else {
            taxAmount = (amount * taxRule.taxRate) / 100;
            finalTotal = amount + taxAmount;
        }

        return {
            taxAmount: Math.round(taxAmount * 100) / 100,
            taxRate: taxRule.taxRate,
            taxName: taxRule.taxName,
            total: Math.round(finalTotal * 100) / 100
        };
    } catch (error) {
        console.error('Error calculating tax:', error);
        return { taxAmount: 0, taxRate: 0, total: amount, taxName: '' };
    }
}
