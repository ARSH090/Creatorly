import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { BookingService } from '@/lib/models/BookingService';
import BookingCalendar from '@/components/bookings/BookingCalendar';

interface BookingPageProps {
    params: Promise<{ creatorUsername: string }>;
}

export async function generateMetadata({ params }: BookingPageProps) {
    const { creatorUsername } = await params;
    await connectToDatabase();
    const creator = await User.findOne({ username: creatorUsername.toLowerCase() });
    
    if (!creator) {
        return { title: 'Not Found | Creatorly' };
    }

    return {
        title: `Book with ${creator.displayName} | Creatorly`,
        description: `Schedule a session with ${creator.displayName}`,
    };
}

export default async function BookingPage({ params }: BookingPageProps) {
    const { creatorUsername } = await params;
    await connectToDatabase();

    const creator = await User.findOne({
        username: creatorUsername.toLowerCase(),
        status: 'active'
    }).lean();

    if (!creator) {
        notFound();
    }

    const services = await BookingService.find({
        creatorId: creator._id,
        isActive: true
    }).lean();

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Book with {creator.displayName}</h1>
                    <p className="text-zinc-400">Select a service and time that works for you.</p>
                </div>

                <BookingCalendar 
                    creator={JSON.parse(JSON.stringify(creator))}
                    services={JSON.parse(JSON.stringify(services))}
                />
            </div>
        </div>
    );
}
