import { AdminLayout } from '@/components/admin/AdminLayout';
import { OrdersManagement } from '@/components/admin/OrdersManagement';

export const dynamic = 'force-dynamic';

export default function AdminOrdersPage() {
  return (
    <AdminLayout adminName="" adminEmail="" onLogout={() => {}}>
      <OrdersManagement />
    </AdminLayout>
  );
}
