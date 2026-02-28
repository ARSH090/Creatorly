'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    BarChart3, TrendingUp, Users, DollarSign,
    ArrowUpRight, ArrowDownRight, Globe,
    Download, Package, UserPlus, MessageCircle,
    Layers, Rocket, Filter, PieChart, Activity,
    ShoppingBag, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import EmptyState from '@/components/dashboard/EmptyState';

type RangeKey = '7D' | '30D' | '90D' | 'All';
type TabKey = 'overview' | 'financials' | 'marketing' | 'engagement';

export default function AnalyticsPage() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const [range, setRange] = useState<RangeKey>('30D');
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data States
    const [stats, setStats] = useState<any>(null);
    const [mrrData, setMrrData] = useState<any>(null);
    const [trafficData, setTrafficData] = useState<any>(null);
    const [funnelData, setFunnelData] = useState<any>(null);
    const [leadData, setLeadData] = useState<any>(null);
    const [series, setSeries] = useState<any>(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        let cancelled = false;
        async function loadData() {
            try {
                setLoading(true);
                setError(null);
                const token = await getToken();
                const days = range === 'All' ? '90' : range.replace('D', '');

                const [statsRes, mrrRes, trafficRes, funnelRes, leadRes, seriesRes] = await Promise.all([
                    fetch('/api/creator/analytics', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/creator/analytics/revenue/mrr', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`/api/creator/analytics/traffic?days=${days}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`/api/creator/analytics/funnel?days=${days}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`/api/creator/analytics/leads?days=${days}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`/api/creator/analytics/series?days=${days}`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const [sJson, mJson, tJson, fJson, lJson, srJson] = await Promise.all([
                    statsRes.json(), mrrRes.json(), trafficRes.json(), funnelRes.json(), leadRes.json(), seriesRes.json()
                ]);

                if (cancelled) return;

                setStats(sJson);
                setMrrData(mJson);
                setTrafficData(tJson);
                setFunnelData(fJson);
                setLeadData(lJson);
                setSeries(srJson.data || null);

            } catch (e: any) {
                if (!cancelled) setError('Failed to load deep analytics. Showing baseline stats.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, [range, isLoaded, isSignedIn]);

    const tabs = [
        { id: 'overview', name: 'Overview', icon: BarChart3 },
        { id: 'financials', name: 'Financials', icon: DollarSign },
        { id: 'marketing', name: 'Marketing', icon: Globe },
        { id: 'engagement', name: 'Engagement', icon: MessageCircle }
    ];

    const isLoadingSkeleton = loading && !stats;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tight italic uppercase">Analytics <span className="text-indigo-500 font-black not-italic ml-2">PRO</span></h1>
                    <p className="text-zinc-500 font-medium">Professional-grade intelligence for your digital empire.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-2xl">
                    {(['7D', '30D', '90D', 'All'] as RangeKey[]).map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${range === r ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/5 gap-8 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabKey)}
                        className={`pb-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.name}
                        {activeTab === tab.id && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-12"
                >
                    {activeTab === 'overview' && (
                        <>
                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <QuickStatCard label="Total Revenue" value={`₹${stats?.todayRevenue?.toLocaleString() || '0'}`} icon={DollarSign} trend="+12%" />
                                <QuickStatCard label="Platform Views" value={stats?.todayVisitors?.toLocaleString() || '0'} icon={Globe} trend="+5%" />
                                <QuickStatCard label="Bounce Rate" value={`${stats?.bounceRate || 0}%`} icon={Zap} trend="-2%" color="rose" />
                                <QuickStatCard label="Conv. Rate" value={`${funnelData?.rates?.overall || 0}%`} icon={Activity} trend="+2%" color="indigo" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <RevenueChart range={range} series={series} loading={loading} />
                                <TopProducts products={stats?.recentOrders || []} loading={loading} />
                            </div>
                        </>
                    )}

                    {activeTab === 'financials' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Recurring Revenue (MRR)</h3>
                                            <p className="text-xs text-zinc-500 font-medium">Projected monthly revenue from active subscriptions.</p>
                                        </div>
                                        <div className="text-right">
                                            <h4 className="text-4xl font-black text-emerald-400 tracking-tighter">₹{mrrData?.totalMRR?.toLocaleString() || '0'}</h4>
                                            <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mt-1">LTD Revenue Potential</p>
                                        </div>
                                    </div>
                                    <div className="h-48 flex items-end gap-2 border-t border-white/5 pt-8">
                                        {/* Simplified MRR projected growth bars */}
                                        {[40, 45, 55, 60, 75, 85, 95, 100].map((h, i) => (
                                            <div key={i} className="flex-1 bg-emerald-500/10 rounded-t-xl hover:bg-emerald-500/20 transition-all cursor-crosshair relative group" style={{ height: `${h}%` }}>
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/5 px-2 py-1 rounded text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Month {i + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <MetricCard label="Active Subs" value={mrrData?.activeSubscribers || 0} icon={Users} />
                                    <MetricCard label="Churn Rate" value={`${mrrData?.growthRate < 0 ? Math.abs(mrrData?.growthRate) : 0}%`} icon={TrendingUp} color="rose" />
                                </div>
                            </div>
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Plan Distribution</h3>
                                <div className="space-y-6">
                                    {mrrData?.planBreakdown?.map((plan: any) => (
                                        <div key={plan.name} className="space-y-3">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-zinc-400">{plan.name}</span>
                                                <span className="text-white">{plan.count} users</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(plan.count / (mrrData?.activeSubscribers || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'marketing' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Top Traffic Channels</h3>
                                    <div className="space-y-8">
                                        {trafficData?.sources?.map((src: any) => (
                                            <div key={src.name} className="flex items-center gap-6">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500">
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black uppercase tracking-widest text-white">{src.name}</span>
                                                        <span className="text-xs font-bold text-zinc-500">{src.count} visits</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(src.count / (trafficData.sources[0]?.count || 1)) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-indigo-600 rounded-[3rem] p-10 text-white flex flex-col justify-between">
                                    <Rocket className="w-12 h-12" />
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Campaign Strategy</h3>
                                        <p className="text-sm font-medium text-indigo-100">Use UTM parameters to track specific posts. Check out technical docs to learn more.</p>
                                        <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Documentation</button>
                                    </div>
                                </div>
                            </div>
                            {/* Funnel Visualization */}
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-12 space-y-12">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Global Storefront Funnel</h3>
                                    <p className="text-sm text-zinc-500 font-medium italic">Tracking the journey from landing to final checkout.</p>
                                </div>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    {funnelData?.funnel?.map((stage: any, i: number) => (
                                        <React.Fragment key={stage.stage}>
                                            <div className="flex-1 w-full text-center space-y-4 group">
                                                <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 group-hover:bg-white/10 transition-all">
                                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stage.stage}</p>
                                                    <h4 className="text-3xl font-black text-white tracking-widest">{stage.count}</h4>
                                                </div>
                                                {i < funnelData.funnel.length - 1 && (
                                                    <div className="hidden md:flex flex-col items-center">
                                                        <div className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                                                            {(Object.values(funnelData.rates) as any)[i]}% CR
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {i < funnelData.funnel.length - 1 && (
                                                <div className="w-8 h-8 md:w-4 md:h-24 flex items-center justify-center text-zinc-800">
                                                    <ChevronRight className="w-6 h-6 rotate-90 md:rotate-0" />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'engagement' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Audience Growth</h3>
                                <div className="h-64 flex items-end gap-1 pt-8">
                                    {(leadData?.leads?.chartData?.length > 0 ? leadData.leads.chartData : Array(30).fill({ count: 10 })).map((d: any, i: number) => (
                                        <div key={i} className="flex-1 bg-white/5 rounded-t-sm hover:bg-indigo-500/50 transition-all cursor-help relative group" style={{ height: `${(d.count / (Math.max(...leadData?.leads?.chartData?.map((ld: any) => ld.count) || [100]))) * 100}%` }}>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/5 px-2 py-1 rounded text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                {d.count} Leads
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-8 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Active Leads</p>
                                        <h4 className="text-2xl font-black text-white">{leadData?.leads?.total || 0}</h4>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New (Last 30d)</p>
                                        <h4 className="text-2xl font-black text-indigo-400">+{leadData?.leads?.growth30d || 0}</h4>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">DM Automation Hub</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    {leadData?.dm?.providerBreakdown?.map((p: any) => (
                                        <div key={p.provider} className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{p.provider}</span>
                                                <Activity className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <h4 className="text-3xl font-black text-white">{p.count}</h4>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{p.successRate}% Success Rate</p>
                                        </div>
                                    ))}
                                    {(!leadData?.dm?.providerBreakdown || leadData.dm.providerBreakdown.length === 0) && (
                                        <div className="col-span-2">
                                            <EmptyState
                                                icon={MessageCircle}
                                                title="No DM Activity"
                                                description="Your automated DM logs will appear here once active."
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Overall Click CTR</span>
                                        <span className="text-[10px] font-black text-emerald-400">Above Avg</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full w-[65%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Sub-components
function QuickStatCard({ label, value, icon: Icon, trend, color = 'emerald' }: any) {
    return (
        <motion.div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[2.5rem] space-y-4 hover:border-white/10 transition-colors group">
            <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-zinc-300 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                    <ArrowUpRight className="w-3 h-3" />
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{label}</p>
                <h3 className="text-2xl font-black mt-1 text-white">{value}</h3>
            </div>
        </motion.div>
    );
}

function RevenueChart({ range, series, loading }: any) {
    return (
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8 flex flex-col">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Financial Velocity</h3>
                    <p className="text-xs text-zinc-500 font-medium">Daily revenue over the last {range}.</p>
                </div>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300">
                    Export <Download className="w-3 h-3" />
                </button>
            </div>
            <div className="flex-1 min-h-[300px] border border-dashed border-white/5 rounded-3xl relative overflow-hidden p-8 flex items-end gap-1">
                {(series ? series.revenue : Array(20).fill({ amount: 2000 })).map((p: any, i: number) => {
                    const max = Math.max(...(series?.revenue?.map((rv: any) => rv.amount) || [5000]), 1);
                    const h = ((p.amount || 0) / max) * 100;
                    return (
                        <div key={i} className="flex-1 bg-indigo-500/10 rounded-t-lg hover:bg-indigo-500 transition-all cursor-crosshair group relative" style={{ height: `${Math.max(h, 4)}%` }}>
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black border border-white/5 p-2 rounded-xl text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl z-10 whitespace-nowrap">
                                ₹{p.amount?.toLocaleString()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TopProducts({ products, loading }: any) {
    return (
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Recent Activity</h3>
            <div className="space-y-6">
                {products.length === 0 ? (
                    <EmptyState
                        imageUrl="/empty-analytics.png"
                        title="Waiting for Data"
                        description="Your real-time sales and activity feeds will populate as they occur."
                    />
                ) : products.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{p.customerEmail}</h4>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.time}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-white">₹{p.amount}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color = 'indigo' }: any) {
    const colorMap = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    };
    return (
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
                <h4 className="text-3xl font-black text-white tracking-widest">{value}</h4>
            </div>
            <div className={`p-4 rounded-2xl ${colorMap[color as keyof typeof colorMap]}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
}

function ChevronRight(props: any) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    )
}
