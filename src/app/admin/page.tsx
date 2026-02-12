'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/admin/login');
                return;
            }

            const idTokenResult = await user.getIdTokenResult();
            if (!idTokenResult.claims.admin) {
                router.push('/admin/login');
                return;
            }

            // Fetch dashboard stats
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/admin/analytics/summary?days=30', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch stats');

                const data = await res.json();
                setStats(data.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await auth.signOut();
        sessionStorage.removeItem('adminToken');
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <p className="text-red-600">Error: {error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-purple-600">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Creatorly Admin</h1>
                    <div className="flex items-center gap-4">
                        <nav className="flex gap-4">
                            <a href="/admin" className="text-purple-600 font-medium">Dashboard</a>
                            <a href="/admin/users" className="text-gray-600 hover:text-purple-600">Users</a>
                            <a href="/admin/products" className="text-gray-600 hover:text-purple-600">Products</a>
                            <a href="/admin/orders" className="text-gray-600 hover:text-purple-600">Orders</a>
                            <a href="/admin/coupons" className="text-gray-600 hover:text-purple-600">Coupons</a>
                            <a href="/admin/payouts" className="text-gray-600 hover:text-purple-600">Payouts</a>
                            <a href="/admin/logs" className="text-gray-600 hover:text-purple-600">Logs</a>
                        </nav>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Platform Overview</h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Users */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.users?.total.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                    +{stats?.users?.new || 0} new (30d)
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    ₹{stats?.revenue?.allTime?.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                    ₹{stats?.revenue?.recent?.toLocaleString() || 0} (30d)
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.orders?.allTime?.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                    +{stats?.orders?.recent || 0} (30d)
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Creators */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Creators</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.users?.creators || 0}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {stats?.products?.published || 0} products
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <a href="/admin/users" className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                        <h3 className="font-semibold text-gray-900 mb-2">Manage Users</h3>
                        <p className="text-sm text-gray-600">View, suspend, or edit user accounts</p>
                    </a>

                    <a href="/admin/payouts" className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                        <h3 className="font-semibold text-gray-900 mb-2">Process Payouts</h3>
                        <p className="text-sm text-gray-600">Approve pending creator payouts</p>
                    </a>

                    <a href="/admin/coupons" className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                        <h3 className="font-semibold text-gray-900 mb-2">Create Coupon</h3>
                        <p className="text-sm text-gray-600">Add platform-wide discount codes</p>
                    </a>
                </div>
            </main>
        </div>
    );
}
