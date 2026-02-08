import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardMetrics } from '@/components/admin/DashboardMetrics';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return (
    <AdminLayout adminName="" adminEmail="" onLogout={() => {}}>
      <DashboardMetrics />
    </AdminLayout>
  );
}
