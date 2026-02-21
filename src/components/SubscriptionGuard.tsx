import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/lib/models/User';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { ReactNode } from 'react';

export default async function SubscriptionGuard({ children }: { children: ReactNode }) {
    await dbConnect();
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Fetch User with Lean for performance
    const user = await User.findOne({ clerkId: userId }).select('subscriptionStatus isSuspended role onboardingComplete').lean();

    if (!user || user.onboardingComplete === false) {
        // Force onboarding if not complete
        redirect('/onboarding');
    }

    if (user.isSuspended) {
        // Maybe a suspended page?
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-800">
                <div>
                    <h1 className="text-2xl font-bold">Account Suspended</h1>
                    <p>Please contact support for assistance.</p>
                </div>
            </div>
        );
    }

    // Admins bypass
    if (user.role === 'admin' || user.role === 'super-admin') {
        return <>{children}</>;
    }

    // Check Subscription
    // Allow 'active' and 'trialing'
    if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing') {
        redirect('/subscribe');
    }

    return <>{children}</>;
}

