import { getCurrentUser } from '@/lib/auth/server-auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { OrdersManagement } from '@/components/admin/OrdersManagement';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout
      adminName={user.displayName || 'Admin'}
      adminEmail={user.email || ''}
    >
      <OrdersManagement />
    </AdminLayout>
  );
}
