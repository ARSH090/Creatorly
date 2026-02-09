import { AdminLayout } from '@/components/admin/AdminLayout';
import { FinanceDashboard } from '@/components/admin/FinanceDashboard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminFinancePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout
      adminName={session.user?.name || 'Admin'}
      adminEmail={session.user?.email || ''}
    >
      <FinanceDashboard />
    </AdminLayout>
  );
}
