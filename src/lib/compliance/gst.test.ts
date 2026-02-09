import { describe, it, expect } from 'vitest';
import { calculateGST } from '@/lib/compliance/gst';

describe('GST Compliance Engine', () => {
    it('should correctly calculate IGST for interstate transactions', () => {
        const amount = 1000;
        const result = calculateGST(amount, {
            rate: 18,
            stateOfOrigin: 'Delhi',
            stateOfConsumption: 'Maharashtra'
        });

        expect(result.igst).toBe(180);
        expect(result.cgst).toBe(0);
        expect(result.sgst).toBe(0);
        expect(result.totalAmount).toBe(1180);
        expect(result.type).toBe('IGST');
    });

    it('should correctly calculate CGST/SGST for intrastate transactions', () => {
        const amount = 1000;
        const result = calculateGST(amount, {
            rate: 18,
            stateOfOrigin: 'Delhi',
            stateOfConsumption: 'Delhi'
        });

        expect(result.igst).toBe(0);
        expect(result.cgst).toBe(90);
        expect(result.sgst).toBe(90);
        expect(result.totalAmount).toBe(1180);
        expect(result.type).toBe('CGST/SGST');
    });

    it('should handle zero amount gracefully', () => {
        const result = calculateGST(0, {
            rate: 18,
            stateOfOrigin: 'Delhi',
            stateOfConsumption: 'Delhi'
        });
        expect(result.totalAmount).toBe(0);
        expect(result.totalGst).toBe(0);
    });

    it('should enforce 18% default rate for undefined categories', () => {
        const amount = 100;
        const result = calculateGST(amount, {
            rate: undefined,
            stateOfOrigin: 'Delhi',
            stateOfConsumption: 'Delhi'
        });
        expect(result.totalGst).toBe(18);
    });
});
