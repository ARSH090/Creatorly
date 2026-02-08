'use client';

import CreatorDashboard from '@/components/CreatorDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <CreatorDashboard />
        </ProtectedRoute>
    );
}
