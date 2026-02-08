import { AdminLayout } from '@/components/admin/AdminLayout';
import { CouponsManagement } from '@/components/admin/CouponsManagement';

export const dynamic = 'force-dynamic';

export default function AdminCouponsPage() {
  return (
    <AdminLayout adminName="" adminEmail="" onLogout={() => {}}>
      <CouponsManagement />
    </AdminLayout>
  );
}
