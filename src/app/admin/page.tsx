// @ts-nocheck
import AdminDashboardMetrics from '@/components/admin/DashboardMetrics';
import GrowthTrendCard from '@/components/admin/GrowthTrendCard';
import UserManagement from '@/components/admin/UserManagement';
import {
    Users,
    ShoppingCart,
    ArrowUpRight,
    TrendingUp,
    ShieldAlert,
    Clock,
    ChevronRight,
    Search,
    Download,
    Shield,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import { getSecurityEventsDB } from '@/lib/security/monitoring';

export const dynamic = 'force-dynamic';

function formatRelativeTime(date: Date) {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
}

export default async function AdminDashboard() {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
        redirect('/auth/login');
    }

    const adminName = user.displayName || 'Admin';
    const adminEmail = user.email || '';

    // Fetch real security events
    const securityEvents = await getSecurityEventsDB({}, 6);

    return (
        <div className="min-h-screen p-2 lg:p-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter italic">
                            <Shield className="w-10 h-10 text-indigo-500" />
                            CORE OVERRIDE
                        </h1>
                        <p className="text-[10px] font-black text-zinc-600 mt-1 uppercase tracking-[0.3em]">
                            Platform Surveillance • Node v2.0.4
                        </p>
                    </div>
                    <div className="flex items-center gap-5 bg-zinc-900/50 p-2 pl-5 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                        <div className="text-right">
                            <p className="text-xs font-black text-white tracking-widest uppercase">{adminName}</p>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{adminEmail}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-indigo-500/20 border border-white/10 group-hover:scale-105 transition-transform">
                            {adminName.charAt(0)}
                        </div>
                    </div>
                </header>

                <AdminDashboardMetrics />

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Recent Alerts */}
                    <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-3xl relative overflow-hidden group backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                            <AlertTriangle className="w-32 h-32 text-amber-500" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-black text-white mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
                                <div className="w-2.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                Threat Detection Feed
                            </h2>
                            <div className="space-y-4">
                                {securityEvents.length > 0 ? securityEvents.map((event) => (
                                    <div
                                        key={event.eventId}
                                        className="flex items-start gap-5 p-5 rounded-3xl bg-black/40 hover:bg-white/[0.03] border border-white/5 transition-all cursor-pointer group/item"
                                    >
                                        <div className={`w-3 h-3 rounded-full mt-2 shrink-0 shadow-lg ${event.severity === 'critical' ? 'bg-rose-500 shadow-rose-500/30' :
                                            event.severity === 'high' ? 'bg-orange-500 shadow-orange-500/30' : 'bg-amber-400 shadow-amber-400/30'
                                            }`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-black text-xs text-zinc-300 group-hover/item:text-indigo-400 transition-colors uppercase tracking-[0.1em]">
                                                    {event.eventType.replace(/_/g, ' ')}
                                                </p>
                                                <span className="text-[9px] font-black text-zinc-600 group-hover/item:text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                                                    {formatRelativeTime(event.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-bold mt-2 line-clamp-1 opacity-60 font-mono uppercase tracking-tighter">
                                                {event.ipAddress} • {JSON.stringify(event.context).slice(0, 50)}...
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No active threats detected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* User Growth */}
                    <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-3xl relative overflow-hidden group backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                            <TrendingUp className="w-32 h-32 text-indigo-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <h1 className="text-xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                                    <div className="w-2.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                    METRIC SURVEILLANCE
                                </h1>
                                <div className="flex items-center gap-4">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="bg-white/5 border-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] px-8 h-14 rounded-2xl"
                                    >
                                        <a href="/api/admin/export/transactions">
                                            <Download className="w-4 h-4 mr-2 text-indigo-400" />
                                            Export Payments
                                        </a>
                                    </Button>
                                </div>
                            </div>
                            <GrowthTrendCard />
                        </div>
                    </div>
                </div>

                {/* User Management Section */}
                <section className="space-y-6">
                    <UserManagement />
                </section>
            </div>
        </div>
    );
}
