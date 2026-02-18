import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';
import User from '@/lib/models/User';
import Booking from '@/lib/models/Booking';
import { addMinutes, format, parse, isAfter, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        await connectToDatabase();
        const { username } = await params;
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date'); // YYYY-MM-DD

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();

        // 1. Find Creator
        const creator = await User.findOne({ username, role: 'creator' });
        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        // 2. Get Profile & Availability
        const profile = await CreatorProfile.findOne({ creatorId: creator._id });
        if (!profile || !profile.availability) {
            return NextResponse.json({ error: 'Availability not configured' }, { status: 404 });
        }

        if (!profile.availability.isBookingEnabled) {
            return NextResponse.json({ error: 'Booking is disabled' }, { status: 403 });
        }

        const productId = searchParams.get('productId');
        let slotDuration = profile.availability.defaultSlotDuration || 30;

        if (productId) {
            const product = await import('@/lib/models/Product').then(m => m.Product.findById(productId));
            if (product && product.coachingDuration) {
                slotDuration = product.coachingDuration;
            }
        }

        const dayConfig = profile.availability.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);
        if (!dayConfig || !dayConfig.active || dayConfig.slots.length === 0) {
            return NextResponse.json({ slots: [] });
        }

        // 3. Get existing bookings for this day
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const bookings = await Booking.find({
            creatorId: creator._id,
            startTime: { $gte: dayStart, $lte: dayEnd },
            status: { $in: ['confirmed', 'pending'] }
        });

        // 4. Generate all possible slots
        const availableSlots: string[] = [];
        const bufferTime = profile.availability.bufferTime || 15;

        dayConfig.slots.forEach(range => {
            let current = parse(`${dateStr} ${range.start}`, 'yyyy-MM-dd HH:mm', new Date());
            const end = parse(`${dateStr} ${range.end}`, 'yyyy-MM-dd HH:mm', new Date());

            while (isAfter(end, addMinutes(current, slotDuration))) {
                const slotStart = current;
                const slotEnd = addMinutes(current, slotDuration);

                // Check for overlap with bookings
                const isBusy = bookings.some(b => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    // Overlap logic: (StartA < EndB) and (EndA > StartB)
                    return slotStart < bEnd && slotEnd > bStart;
                });

                if (!isBusy) {
                    availableSlots.push(format(slotStart, "HH:mm"));
                }

                current = addMinutes(slotEnd, bufferTime);
            }
        });

        return NextResponse.json({ slots: availableSlots });
    } catch (error: any) {
        console.error('Slot calculation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
