// @ts-nocheck
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FinanceDashboard } from '@/components/admin/FinanceDashboard';
import { getCurrentUser } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminFinancePage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout
      adminName={user.displayName || 'Admin'}
      adminEmail={user.email || ''}
    >
      <FinanceDashboard />
    </AdminLayout>
  );
}
