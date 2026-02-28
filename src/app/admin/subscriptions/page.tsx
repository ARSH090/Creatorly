import { getCurrentUser } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import SubscriptionsPageContent from '@/components/admin/subscription/LazySubscriptions';

export const revalidate = 0;

export default async function AdminSubscriptionsPage() {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
        redirect('/auth/login');
    }

    const adminName = user.displayName || 'Admin';
    const adminEmail = user.email || '';

    return (
        <AdminLayout
            adminName={adminName}
            adminEmail={adminEmail}
        >
            <SubscriptionsPageContent />
        </AdminLayout>
    );
}
