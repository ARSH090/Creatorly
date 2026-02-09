import { getCurrentUser } from '@/lib/firebase/server-auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout
      adminName={user.displayName || 'Admin'}
      adminEmail={user.email || ''}
    >
      <UsersManagement />
    </AdminLayout>
  );
}
