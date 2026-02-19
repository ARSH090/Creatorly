import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { PlatformSettings } from '@/lib/models/PlatformSettings';
import { User } from '@/lib/models/User';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import SubscribeClient from './client'; // Separate Client Component for interactivity

export const dynamic = 'force-dynamic';

export default async function SubscribePage() {
    await dbConnect();
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in?redirect_url=/subscribe');
    }

    // Fetch user details
    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user) {
        redirect('/sign-in');
    }

    if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
        redirect('/dashboard');
    }

    // Fetch settings
    const settings = await PlatformSettings.findOne().lean();

    if (!settings) {
        return <div>Subscription system not configured. Contact support.</div>;
    }

    const plans = {
        monthly: settings.subscriptionPlans?.monthly || { price: 999, active: true },
        yearly: settings.subscriptionPlans?.yearly || { price: 9999, active: true }
    };

    return (
        <SubscribeClient
            plans={plans}
            user={{
                name: user.displayName,
                email: user.email,
                contact: user.phone || ''
            }}
            userId={userId}
        />
    );
}

