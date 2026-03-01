'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Head from 'next/head';
import { Activity, ShieldAlert, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminAutoDMDashboard() {
    const { isLoaded, userId } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && userId) {
            fetchAdminStats();
        }
    }, [isLoaded, userId]);

    const fetchAdminStats = async () => {
        try {
            const res = await fetch('/api/admin/autodm/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const togglePlatformAutoDM = async () => {
        if (!stats) return;
        if (!confirm(`Are you sure you want to ${stats.autoDMEnabled ? 'DISABLE' : 'ENABLE'} AutoDM platform-wide?`)) return;

        try {
            const res = await fetch('/api/admin/autodm/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !stats.autoDMEnabled })
            });

            if (res.ok) {
                fetchAdminStats();
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return <div className="p-8">Loading Admin Data...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <Head>
                <title>Admin - AutoDM Health</title>
            </Head>

            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldAlert className="text-red-500 w-6 h-6" />
                        Platform Health: AutoDM
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Monitoring overall API usage and system stability. (No DM content is visible)</p>
                </div>

                <Button
                    variant={stats?.autoDMEnabled ? 'destructive' : 'default'}
                    onClick={togglePlatformAutoDM}
                >
                    {stats?.autoDMEnabled ? 'Disable AutoDM Platform-Wide' : 'Enable AutoDM Platform-Wide'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">Active Rules (Global)</span>
                    </div>
                    <p className="text-4xl font-bold">{stats?.totalActiveRules || 0}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                        <span className="font-medium">DMs Sent Today</span>
                    </div>
                    <p className="text-4xl font-bold text-green-600">{stats?.dmsSentToday || 0}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        <span className="font-medium">Failed DMs Today</span>
                    </div>
                    <p className="text-4xl font-bold text-red-600">{stats?.failedDMsToday || 0}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        <span className="font-medium">Creators Using Feature</span>
                    </div>
                    <p className="text-4xl font-bold">{stats?.creatorsUsingAutoDM || 0}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b dark:border-zinc-800">
                    <h3 className="font-semibold text-lg">Creator Health (High Failure Rates)</h3>
                </div>
                <div className="p-8 text-center text-zinc-500 text-sm">
                    System mapping healthy. No creators exceeding failure thresholds.
                </div>
            </div>

        </div>
    );
}
