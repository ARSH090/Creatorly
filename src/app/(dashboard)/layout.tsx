import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SubscriptionGuard>
            <DashboardLayout>{children}</DashboardLayout>
        </SubscriptionGuard>
    );
}
