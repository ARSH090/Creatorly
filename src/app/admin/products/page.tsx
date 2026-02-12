import { getCurrentUser } from '@/lib/firebase/server-auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
        redirect('/auth/login');
    }

    return (
        <AdminLayout
            adminName={user.displayName || 'Admin'}
            adminEmail={user.email || ''}
        >
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Product Moderation</h2>
                {/* Products component will be built next */}
                <p className="text-gray-600">Product moderation coming soon...</p>
            </div>
        </AdminLayout>
    );
}
