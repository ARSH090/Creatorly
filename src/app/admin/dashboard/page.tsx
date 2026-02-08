import { getServerSession } from 'next-auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardMetrics } from '@/components/admin/DashboardMetrics';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout
      adminName={session.user?.name || 'Admin'}
      adminEmail={session.user?.email || ''}
    >
      <DashboardMetrics />
    </AdminLayout>
  );
}
