import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ── Bypass for Testing ──
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const testSecret = process.env.TEST_SECRET;
    const incomingSecret = headerList.get('x-test-secret');

    if (testSecret && incomingSecret === testSecret) {
        return <DashboardLayout>{children}</DashboardLayout>;
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>{children}</DashboardLayout>
        </ProtectedRoute>
    );
}
