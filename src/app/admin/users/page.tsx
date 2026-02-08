import { AdminLayout } from '@/components/admin/AdminLayout';
import { UsersManagement } from '@/components/admin/UsersManagement';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <AdminLayout adminName="" adminEmail="" onLogout={() => {}}>
      <UsersManagement />
    </AdminLayout>
  );
}
