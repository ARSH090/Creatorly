import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import SubscriptionsPageContent from '@/components/admin/subscription/SubscriptionsPageContent';

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    return (
        <AdminLayout
            adminName={session.user?.name || 'Admin'}
            adminEmail={session.user?.email || ''}
        >
            <SubscriptionsPageContent />
        </AdminLayout>
    );
}
