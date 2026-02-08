import { AdminLayout } from '@/components/admin/AdminLayout';
import { FinanceDashboard } from '@/components/admin/FinanceDashboard';

export const dynamic = 'force-dynamic';

export default function AdminFinancePage() {
  return (
    <AdminLayout adminName="" adminEmail="" onLogout={() => {}}>
      <FinanceDashboard />
    </AdminLayout>
  );
}
