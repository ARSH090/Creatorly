import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CouponsManagement } from '@/components/admin/CouponsManagement';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout
      adminName={session.user?.name || 'Admin'}
      adminEmail={session.user?.email || ''}
    >
      <CouponsManagement />
    </AdminLayout>
  );
}
