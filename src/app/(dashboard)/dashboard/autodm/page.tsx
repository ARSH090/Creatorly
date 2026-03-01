'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Instagram, TrendingUp, Users, MessageCircle, AlertCircle } from 'lucide-react';
import Head from 'next/head';

interface IGStatus {
    isConnected: boolean;
    username: string | null;
    profilePicUrl: string | null;
    stats: {
        activeRules: number;
        dmsSentToday: number;
        totalDMsSent: number;
        followGateWait: number;
        conversionRate: string;
    } | null;
}

export default function AutoDMDashboard() {
    const { isLoaded, userId } = useAuth();
    const router = useRouter();

    const [status, setStatus] = useState<IGStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && userId) {
            fetchStatus();
        }
    }, [isLoaded, userId]);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/instagram/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        window.location.href = '/api/instagram/connect';
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect? All AutoDM rules will stop working.')) return;

        try {
            setLoading(true);
            await fetch('/api/instagram/disconnect', { method: 'POST' });
            await fetchStatus();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="flex justify-center items-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!status?.isConnected) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6">
                <Head><title>Instagram AutoDM | Creatorly</title></Head>
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                    <div className="text-center max-w-lg mx-auto space-y-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-pink-500/20">
                            <Instagram className="h-8 w-8" />
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight">Connect Your Instagram</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            Automate your DMs, capture leads from comments, and grow your audience on autopilot.
                        </p>

                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 text-left border border-zinc-100 dark:border-zinc-800">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-500" />
                                Requirements:
                            </h3>
                            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500">✅</span> Instagram Business or Creator account
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500">✅</span> Connected to a Facebook Page
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500">✅</span> Professional account enabled
                                </li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleConnect}
                            className="w-full sm:w-auto mt-8 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white shadow-md transition-all rounded-full px-8 py-6 text-lg"
                        >
                            Connect Instagram Account
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const s = status.stats || {
        activeRules: 0, dmsSentToday: 0, totalDMsSent: 0, followGateWait: 0, conversionRate: '0%'
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            <Head><title>Instagram AutoDM | Creatorly</title></Head>

            {/* Header Profile */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    {status.profilePicUrl ? (
                        <img src={status.profilePicUrl} alt="IG Profile" className="w-16 h-16 rounded-full border border-zinc-200" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Instagram className="text-zinc-400 w-8 h-8" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">AutoDM Dashboard</h1>
                        <p className="text-zinc-500">Connected as @{status.username}</p>
                    </div>
                </div>
                <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleDisconnect}>
                    Disconnect
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium text-sm">Rules Active</span>
                    </div>
                    <p className="text-3xl font-bold">{s.activeRules}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Total DMs Sent</span>
                    </div>
                    <p className="text-3xl font-bold">{s.totalDMsSent}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-sm">Sent Today</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600 tracking-tight">{s.dmsSentToday}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <span className="font-medium text-sm">Follow Gate Wait</span>
                    </div>
                    <p className="text-3xl font-bold">{s.followGateWait}</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-sm">Conversion Rate</span>
                    </div>
                    <p className="text-3xl font-bold">{s.conversionRate}</p>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col - Rules */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Active Rules</h2>
                        <Button>+ Create Rule</Button>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden min-h-[200px] flex items-center justify-center text-zinc-500">
                        {/* Rules list component goes here */}
                        <p>No active rules yet. Create one to get started!</p>
                    </div>
                </div>

                {/* Right Col - Live Feed & Pending */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Live Activity
                        </h2>
                        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px]">
                            <p className="text-sm text-zinc-500 text-center mt-10">Listening for trigger events...</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            ⏳ Waiting to Follow
                        </h2>
                        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[200px]">
                            <p className="text-sm text-zinc-500 text-center mt-10">No pending followers.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
