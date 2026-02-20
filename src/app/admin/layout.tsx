import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/auth/login?redirect_url=/admin');
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });

    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
        redirect('/dashboard'); // Creators shouldn't see admin panel
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
