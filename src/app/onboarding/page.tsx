import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import OnboardFlow from './OnboardFlow';

export default async function OnboardingPage() {
    const { userId } = await auth();
    
    if (!userId) {
        redirect('/sign-in');
    }

    // Check if user has completed onboarding
    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });

    // If user exists and has completed onboarding, redirect to dashboard
    if (user?.onboardingComplete) {
        redirect('/dashboard');
    }

    return <OnboardFlow />;
}
