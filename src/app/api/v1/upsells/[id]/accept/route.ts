import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import UpsellOffer from '@/lib/models/UpsellOffer';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// POST /api/v1/upsells/:id/accept
// Body: { sessionToken: string } (where sessionToken is the original orderId)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const { sessionToken } = await req.json();

        if (!sessionToken) return NextResponse.json({ error: 'Session token required' }, { status: 400 });

        const upsell = await UpsellOffer.findById(params.id).populate('offerProductId');
        if (!upsell || !upsell.isActive) {
            return NextResponse.json({ error: 'Upsell offer not available' }, { status: 404 });
        }

        const originalOrder = await Order.findById(sessionToken);
        if (!originalOrder) return NextResponse.json({ error: 'Original order not found' }, { status: 404 });

        // In a real post-purchase upsell, we would use the original payment method.
        // For Razorpay, we can't "reuse" a payment intent as easily as Stripe for one-click without saved cards/mandates.
        // However, we'll simulate the order creation here as per requested flow.
        // In product implementation, this would trigger a new PaymentIntent confirm (Stripe) or a captured payment (Razorpay if permitted).

        const offerProduct = upsell.offerProductId as any;
        const upsellPrice = upsell.priceOverride || offerProduct.pricing.basePrice;

        // Create new order for the upsell
        const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const upsellOrder = await Order.create({
            orderNumber,
            items: [{
                productId: offerProduct._id,
                name: offerProduct.title,
                price: upsellPrice,
                quantity: 1,
                type: offerProduct.productType,
            }],
            creatorId: upsell.creatorId,
            userId: originalOrder.userId,
            customerEmail: originalOrder.customerEmail,
            customerName: originalOrder.customerName,
            amount: upsellPrice,
            total: upsellPrice,
            currency: offerProduct.pricing?.currency || originalOrder.currency,
            status: 'completed', // In production, this would wait for payment success
            paymentStatus: 'paid',
            paymentGateway: originalOrder.paymentGateway,
            parentOrderId: originalOrder._id, // Link to original
            metadata: {
                isUpsell: true,
                originalOrderId: originalOrder._id
            }
        });

        // Here we would call the post-purchase master handler (to be implemented later in P0-WIRING)
        // For now, return success and redirect
        return NextResponse.json({
            success: true,
            redirectUrl: `/thank-you/${upsellOrder._id}`
        });

    } catch (error: any) {
        console.error('Error accepting upsell:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
