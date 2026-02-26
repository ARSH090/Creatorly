import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
        noimageindex: true,
        nocache: true,
    }
};

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
