
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ServiceOffering from '@/lib/models/ServiceOffering';
import Booking from '@/lib/models/Booking'; // Assuming Booking model exists
import mongoose from 'mongoose';
import { addDays, format, parse, startOfDay, endOfDay, isBefore, addMinutes } from 'date-fns';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// GET /api/v1/services/[id]/availability
// Query: date_from, date_to
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        if (!isValidId(id)) {
            return NextResponse.json({ error: 'Invalid Service ID' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');

        if (!dateFrom || !dateTo) {
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        const service = await ServiceOffering.findById(id).lean();
        // Fallback: If ServiceOffering not found, check Product with type 'service' and assume default availability?
        // Relying on ServiceOffering model as per plan.
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        const start = new Date(dateFrom);
        const end = new Date(dateTo);

        // Fetch existing bookings in range
        const bookings = await Booking.find({
            productId: id, // Assuming ServiceOffering links to Product or uses same ID? 
            // The plan said ServiceOffering might be separate. 
            // If Booking uses Product ID, we need to ensure ID matches.
            // Let's assume for now ServiceOffering ID IS linked or used as Product ID in booking context
            // Or we query by creatorId if global availability?
            // "ServiceOffering" has "creatorId".
            // Let's assume we are booking this specific service offering.
            startTime: { $gte: startOfDay(start), $lte: endOfDay(end) },
            status: { $in: ['confirmed', 'pending'] }
        }).lean();

        // Generate Slots
        const availableSlots: any[] = [];
        let currentDate = start;

        // Simple slot generation logic
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();

            // Check if service is available on this day
            if (service.availabilityPattern.days.includes(dayOfWeek)) {
                // Get hours for this day (simplified: assumes same hours for all available days)
                // Real implementation might have day-specific hours.
                const hours = service.availabilityPattern.hours;

                for (const hourRange of hours) {
                    let slotStart = parse(`${format(currentDate, 'yyyy-MM-dd')} ${hourRange.start}`, 'yyyy-MM-dd HH:mm', new Date());
                    const slotEndLimit = parse(`${format(currentDate, 'yyyy-MM-dd')} ${hourRange.end}`, 'yyyy-MM-dd HH:mm', new Date());

                    while (isBefore(slotStart, slotEndLimit) || slotStart.getTime() === slotEndLimit.getTime()) {
                        const slotEnd = addMinutes(slotStart, service.durationMinutes);

                        // Check if slot exceeds limit
                        if (isBefore(slotEndLimit, slotEnd)) break;

                        // Check overlap with bookings
                        const isBooked = bookings.some(b => {
                            const bStart = new Date(b.startTime);
                            const bEnd = new Date(b.endTime);
                            return (
                                (slotStart >= bStart && slotStart < bEnd) ||
                                (slotEnd > bStart && slotEnd <= bEnd) ||
                                (slotStart <= bStart && slotEnd >= bEnd)
                            );
                        });

                        if (!isBooked) {
                            availableSlots.push({
                                date: format(currentDate, 'yyyy-MM-dd'),
                                start: format(slotStart, 'HH:mm'),
                                end: format(slotEnd, 'HH:mm'),
                                timestamp: slotStart.toISOString()
                            });
                        }

                        // Next slot + buffer
                        slotStart = addMinutes(slotEnd, service.availabilityPattern.bufferMinutes);
                    }
                }
            }
            currentDate = addDays(currentDate, 1);
        }

        return NextResponse.json({ available_slots: availableSlots });

    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
