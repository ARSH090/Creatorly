import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OrderModel from '@/lib/models/Order';
import RefundModel from '@/lib/models/Refund';

import { withAuth } from '@/lib/firebase/withAuth';
import { z } from 'zod';
import Razorpay from 'razorpay';

const refundSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    reason: z.enum([
        'customer_request',
        'damaged_product',
        'wrong_item',
        'duplicate_charge',
        'payment_issue',
        'other',
    ]),
    notes: z.string().optional(),
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const POST = withAuth(async (request, user) => {
    try {
        const body = await request.json();
        const validation = refundSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const order = await OrderModel.findOne({
            _id: validation.data.orderId,
            status: 'success',
        });


        if (!order) {
            return NextResponse.json(
                { error: 'Order not found or not eligible for refund' },
                { status: 404 }
            );
        }

        if (!order.razorpayPaymentId) {
            return NextResponse.json(
                { error: 'Payment ID not found' },
                { status: 400 }
            );
        }

        // Check if refund already requested
        const existingRefund = await RefundModel.findOne({
            orderId: validation.data.orderId,
            status: { $in: ['pending', 'initiated'] },
        });


        if (existingRefund) {
            return NextResponse.json(
                { error: 'Refund already requested for this order' },
                { status: 400 }
            );
        }

        // Create refund record
        const refund = await RefundModel.create({
            orderId: order._id,
            razorpayPaymentId: order.razorpayPaymentId,
            amount: order.amount,
            reason: validation.data.reason,
            notes: validation.data.notes,
            status: 'pending',
        });


        // Initiate refund with Razorpay
        try {
            const refundResponse = await razorpay.payments.refund(
                order.razorpayPaymentId,
                {
                    amount: order.amount,
                    notes: {
                        reason: validation.data.reason,
                        orderId: order._id.toString(),
                    },
                }
            );

            // Update refund with Razorpay ref
            await RefundModel.updateOne(
                { _id: refund._id },
                {
                    razorpayRefundId: refundResponse.id,
                    status: 'initiated',
                    processedAt: new Date(),
                }
            );


            return NextResponse.json({
                message: 'Refund initiated successfully',
                refund: {
                    id: refund._id,
                    razorpayRefundId: refundResponse.id,
                    amount: refund.amount,
                    status: 'initiated',
                },
            });
        } catch (razorpayError) {
            console.error('Razorpay refund error:', razorpayError);

            // Update as failed
            await RefundModel.updateOne(
                { _id: refund._id },
                {
                    status: 'failed',
                    notes: `Failed: ${String(razorpayError)}`,
                }
            );


            return NextResponse.json(
                { error: 'Failed to process refund with payment gateway' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Refund endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to process refund request' },
            { status: 500 }
        );
    }
});

export const GET = withAuth(async (request, user) => {
    try {
        await connectToDatabase();

        const refunds = await RefundModel.find({})
            .populate('orderId')
            .sort({ createdAt: -1 })
            .limit(50);


        return NextResponse.json({
            refunds: refunds.map((r) => ({
                id: r._id,
                orderId: r.orderId,
                amount: r.amount,
                reason: r.reason,
                status: r.status,
                requestedAt: r.requestedAt,
                processedAt: r.processedAt,
            })),
        });
    } catch (error) {
        console.error('Get refunds error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch refunds' },
            { status: 500 }
        );
    }
});
