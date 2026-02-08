import { describe, it, expect } from 'vitest';
import { generateUPILink } from '@/lib/payments/upi';

describe('UPI Payment Logic', () => {
    it('should generate a valid UPI deep link with core parameters', () => {
        const params = {
            pa: 'arsh@okaxis',
            pn: 'Arsh Eqbal',
            am: '999.00',
            cu: 'INR',
            tn: 'Purchase Masterclass'
        };
        const link = generateUPILink(params);

        expect(link).toContain('upi://pay');
        expect(link).toContain('pa=arsh%40okaxis');
        expect(link).toContain('am=999.00');
        expect(link).toContain('cu=INR');
        expect(link).toContain('tn=Purchase+Masterclass');
    });

    it('should include optional tracking IDs if provided', () => {
        const params = {
            pa: 'arsh@okaxis',
            pn: 'Arsh Eqbal',
            am: '999.00',
            cu: 'INR',
            tr: 'TXN12345'
        };
        const link = generateUPILink(params);
        expect(link).toContain('tr=TXN12345');
    });

    it('should always lock currency to INR as per Bharat regulations', () => {
        const params = {
            pa: 'arsh@okaxis',
            pn: 'Arsh Eqbal',
            am: '10.00',
            cu: 'USD' // System should enforce INR or ignore this if logic dictates
        };
        const link = generateUPILink(params);
        expect(link).toContain('cu=INR');
    });
});
