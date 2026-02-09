import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import Booking from '@/lib/models/Booking';
import Order from '@/lib/models/Order';
import { razorpay } from '@/lib/payments/razorpay';
import { withAuth } from '@/lib/firebase/withAuth';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req, user) => {
    try {
        const body = await req.json();
        const {
            productId,
            creatorId,
            startTime,
            endTime,
            customerEmail,
            customerName,
            notes
        } = body;

        if (!productId || !creatorId || !startTime || !endTime || !customerEmail || !customerName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Double check availability (Race condition protection)
        const dayStart = startOfDay(new Date(startTime));
        const dayEnd = endOfDay(new Date(startTime));

        const existingBooking = await Booking.findOne({
            creatorId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: { $in: ['confirmed', 'pending'] }
        });

        if (existingBooking) {
            return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
        }

        // 2. Fetch Product for pricing
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 3. Create Pending Booking
        const booking = await Booking.create({
            creatorId,
            customerId: user._id,
            productId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: 'pending',
            customerEmail,
            customerName,
            notes
        });

        // 4. Handle Free vs Paid
        if (product.price === 0) {
            booking.status = 'confirmed';
            await booking.save();

            return NextResponse.json({
                success: true,
                bookingId: booking._id,
                confirmed: true
            });
        }

        // 5. Initiate Razorpay Order for Paid Sessions
        const options = {
            amount: Math.round(product.price * 100),
            currency: product.currency || 'INR',
            receipt: `booking_${booking._id}`,
            notes: {
                bookingId: booking._id.toString(),
                productId: productId.toString(),
                type: 'booking'
            }
        };

        const rzpOrder = await razorpay.orders.create(options);

        // Link Order ID to Booking
        booking.orderId = rzpOrder.id as any; // Temporary link until Order model is created/synced
        await booking.save();

        // Also create a pending Order record for tracking
        await Order.create({
            productId,
            creatorId,
            userId: user._id,
            customerEmail,
            amount: product.price,
            razorpayOrderId: rzpOrder.id,
            status: 'pending',
            metadata: { bookingId: booking._id }
        });

        return NextResponse.json({
            success: true,
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            bookingId: booking._id,
            confirmed: false
        });

    } catch (error: any) {
        console.error('Booking request error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
