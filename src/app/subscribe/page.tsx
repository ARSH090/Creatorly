import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { PlatformSettings } from '@/lib/models/PlatformSettings';
import { User } from '@/lib/models/User';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import SubscribeClient from './client';

export const dynamic = 'force-dynamic';

export default async function SubscribePage() {
    await dbConnect();
    const { userId } = await auth();

    if (!userId) {
        redirect('/auth/login?redirect_url=/subscribe');
    }

    // Fetch user details
    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user) {
        redirect('/auth/login');
    }

    // Already subscribed — go to dashboard
    if ((user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') && user.onboardingComplete) {
        redirect('/dashboard');
    }

    // Fetch all active, visible plans
    const Plan = (await import('@/lib/models/Plan')).default;
    const plans = await Plan.find({ isActive: true, isVisible: true }).sort({ monthlyPrice: 1 }).lean();

    if (plans.length === 0) {
        // Fallback seed if nothing exists (rare case)
        const defaultPlan = await Plan.create({
            name: 'Creatorly Pro',
            tier: 'pro',
            monthlyPrice: 99900,
            yearlyPrice: 999900,
            displayFeatures: ['All Features Included', 'Priority Support'],
            isActive: true,
            isVisible: true,
            razorpayMonthlyPlanId: 'plan_placeholder'
        });
        plans.push(defaultPlan.toObject());
    }

    return (
        <SubscribeClient
            plans={plans.map((p: any) => ({
                id: p._id.toString(),
                name: p.name,
                tier: p.tier,
                monthlyPrice: p.monthlyPrice / 100,
                yearlyPrice: p.yearlyPrice / 100,
                displayFeatures: p.displayFeatures || [],
                razorpayMonthlyPlanId: p.razorpayMonthlyPlanId,
                razorpayYearlyPlanId: p.razorpayYearlyPlanId
            }))}
            user={{
                name: user.displayName || user.email?.split('@')[0] || 'Creator',
                email: user.email,
                contact: user.phone || ''
            }}
            userId={userId}
        />
    );
}
