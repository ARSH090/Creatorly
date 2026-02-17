import { NextRequest, NextResponse } from 'next/server';
import { saveInvoice } from '@/lib/services/invoice';
import { withAuth } from '@/lib/auth/withAuth';

/**
 * GET /api/orders/{orderId}/invoice
 * Download invoice for order
 */
export const GET = withAuth(async (request, user) => {
    try {
        const pathname = request.nextUrl.pathname;
        const orderId = pathname.split('/')[3];

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID required' },
                { status: 400 }
            );
        }

        const pdfBuffer = await saveInvoice(orderId);

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Invoice generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate invoice' },
            { status: 500 }
        );
    }
});
