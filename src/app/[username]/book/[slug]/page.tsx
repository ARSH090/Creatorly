import React from 'react';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { BookingService } from '@/lib/models/BookingService';
import { notFound } from 'next/navigation';
import ServiceBookingClient from './ServiceBookingClient';

async function getServiceDetails(username: string, slug: string) {
    await connectToDatabase();
    const creator = await User.findOne({ username }).select('displayName username avatar');
    if (!creator) return null;

    const service = await BookingService.findOne({
        creatorId: creator._id,
        bookingSlug: slug,
        isActive: true
    });

    if (!service) return null;

    return { creator, service };
}

export default async function ServiceBookingPage({ params }: { params: { username: string; slug: string } }) {
    const data = await getServiceDetails(params.username, params.slug);
    if (!data) notFound();

    const { creator, service } = data;

    // Convert MongoDB objects to plain JS for client component
    const plainCreator = JSON.parse(JSON.stringify(creator));
    const plainService = JSON.parse(JSON.stringify(service));

    return <ServiceBookingClient creator={plainCreator} service={plainService} />;
}
