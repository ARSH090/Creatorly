import { getCurrentUser } from '@/lib/firebase/server-auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { redirect } from 'next/navigation';
import CouponsManagement from '@/components/admin/LazyCoupons';

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout
      adminName={user.displayName || 'Admin'}
      adminEmail={user.email || ''}
    >
      <CouponsManagement />
    </AdminLayout>
  );
}
