
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ServiceOffering from '@/lib/models/ServiceOffering';
import Booking from '@/lib/models/Booking';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';
import { addMinutes, parseISO } from 'date-fns';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// POST /api/v1/services/[id]/book
// Body: { selected_slot, customer_info: { name, email, notes } }
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        // Customer Auth? 
        // Docs say "Auth: Customer". 
        // If guest checkout is allowed, maybe we don't strictly require user in DB yet, but usually we do.
        const user = await getMongoUser();
        // Assuming user is required for now.
        if (!user) return NextResponse.json({ error: 'Please login to book' }, { status: 401 });

        if (!isValidId(id)) {
            return NextResponse.json({ error: 'Invalid Service ID' }, { status: 400 });
        }

        const service = await ServiceOffering.findById(id);
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        const body = await req.json();
        const { selected_slot, customer_info } = body;
        // selected_slot: ISO string timestamp

        if (!selected_slot) {
            return NextResponse.json({ error: 'Selected slot required' }, { status: 400 });
        }

        const startTime = new Date(selected_slot);
        if (isNaN(startTime.getTime())) {
            return NextResponse.json({ error: 'Invalid slot time' }, { status: 400 });
        }

        // Re-check Availability (Double booking prevention)
        const endTime = addMinutes(startTime, service.durationMinutes);

        const conflict = await Booking.findOne({
            productId: id,
            status: { $in: ['confirmed', 'pending'] },
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ]
        });

        if (conflict) {
            return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 });
        }

        // Create Booking
        const booking = await Booking.create({
            creatorId: service.creatorId,
            customerId: user._id,
            productId: id, // Linking to Service Offering ID
            startTime,
            endTime,
            status: 'pending', // Pending payment
            customerName: customer_info?.name || user.name || 'Customer',
            customerEmail: customer_info?.email || user.email,
            notes: customer_info?.notes
        });

        // Create Order logic would go here typically to initiate payment flow
        // returning booking info for now

        return NextResponse.json({
            booking,
            message: 'Slot reserved. Proceed to payment.'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error booking service:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
