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

  const user = await User.findOne({ clerkId: userId })
    .select('subscriptionStatus isSuspended role onboardingComplete emailVerified')
    .lean();

  if (!user) {
    // If we have a Clerk ID but no MongoDB user, it means sync is pending.
    // Showing a loading state instead of redirecting prevents the logic loop
    // with middleware which redirects logged-in users away from /auth/register.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030303] text-white">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold">Setting up your dashboard...</h2>
        <p className="text-zinc-500 mt-2 text-sm">Finishing sync with your account.</p>
      </div>
    );
  }

  // if (user.onboardingComplete === false) {
  //   redirect('/subscribe');
  // }

  // if (!user.emailVerified) {
  //   redirect('/subscribe');
  // }

  if (user.isSuspended) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-800">
        <div>
          <h1 className="text-2xl font-bold">Account Suspended</h1>
          <p>Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  if (user.role === 'admin' || user.role === 'super-admin') {
    return <>{children}</>;
  }

  // if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing') {
  //   redirect('/subscribe');
  // }

  return <>{children}</>;
}
