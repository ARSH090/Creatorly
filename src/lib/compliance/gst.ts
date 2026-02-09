/**
 * GST Logic for Creatorly
 * Handles Indian Tax Compliance (CGST, SGST, IGST).
 */

export interface GSTConfig {
    rate?: number; // Percentage, optional (defaults to 18%)
    stateOfOrigin: string;
    stateOfConsumption: string;
}

export function calculateGST(amount: number, config: GSTConfig) {
    const rate = config.rate ?? 18; // Default 18% if not provided
    const taxableAmount = amount;
    const totalGst = (taxableAmount * rate) / 100;

    const isIntrastate = config.stateOfOrigin.toLowerCase() === config.stateOfConsumption.toLowerCase();

    return {
        cgst: isIntrastate ? totalGst / 2 : 0,
        sgst: isIntrastate ? totalGst / 2 : 0,
        igst: isIntrastate ? 0 : totalGst,
        totalGst,
        taxableAmount,
        totalAmount: taxableAmount + totalGst,
        type: isIntrastate ? 'CGST/SGST' : 'IGST'
    };
}

export const IndianHSNRates: Record<string, number> = {
    "Digital Goods": 18,
    "Consultations": 18,
    "Physical Goods": 12, // Average
};
