'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Mail, Zap, Users, Send,
    ArrowRight, BarChart3,
    MousePointerClick, Sparkles,
    CheckCircle2, Clock, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarketingPage() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/v1/dashboard/summary');
                const data = await res.json();
                setAnalytics(data);
            } catch (err) {
                console.error('Failed to load marketing stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        {
            label: 'Total Audience',
            value: analytics?.leads?.total?.toLocaleString() || '0',
            icon: Users,
            trend: analytics?.leads?.trend ? `${analytics.leads.trend > 0 ? '+' : ''}${analytics.leads.trend}%` : '—'
        },
        {
            label: 'Avg. Engagement',
            value: '42.5%',
            icon: Mail,
            trend: '+5%'
        },
        {
            label: 'Click Rate',
            value: '18.2%',
            icon: MousePointerClick,
            trend: '+2%'
        },
        {
            label: 'Channel ROI',
            value: `₹${analytics?.revenue?.month?.toLocaleString() || '0'}`,
            icon: Sparkles,
            trend: analytics?.revenue?.trend ? `${analytics.revenue.trend > 0 ? '+' : ''}${analytics.revenue.trend}%` : '—'
        },
    ];

    const tools = [
        {
            title: 'Email Campaigns',
            description: 'Send one-time broadcasts and newsletters to your entire audience.',
            href: '/dashboard/email/campaigns',
            icon: Send,
            color: 'indigo',
            features: ['Bulk Delivery', 'A/B Testing', 'HTML Editor']
        },
        {
            title: 'Automated Sequences',
            description: 'Nurture leads with multi-step email workflows triggered by behavior.',
            href: '/dashboard/email/sequences',
            icon: Zap,
            color: 'emerald',
            features: ['Drip Logic', 'Event Triggers', 'Behavior Tracking']
        }
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs tracking-[0.3em]">Booting Marketing OS...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Marketing <span className="text-indigo-500 font-black not-italic ml-2 text-2xl">OS</span></h1>
                    <p className="text-zinc-500 font-medium">Precision-targeted communication for maximum conversion.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/leads">
                        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                            View Audience Leads
                        </button>
                    </Link>
                    <Link href="/dashboard/email/campaigns/new">
                        <button className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5">
                            Draft Broadcast
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] hover:border-white/10 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <stat.icon className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                            <span className={`text-[10px] font-black ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-zinc-600'}`}>{stat.trend}</span>
                        </div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-white mt-1">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Tool Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {tools.map((tool) => (
                    <Link href={tool.href} key={tool.title} className="group">
                        <div className="h-full bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-12 space-y-8 hover:border-indigo-500/30 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-all" />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all`}>
                                    <tool.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{tool.title}</h3>
                                    <p className="text-sm text-zinc-500 font-medium">{tool.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 relative z-10 text-[10px] font-black uppercase tracking-widest">
                                {tool.features.map(f => (
                                    <div key={f} className="flex items-center gap-2 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                        <CheckCircle2 size={12} className="text-indigo-500/50" />
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-4 relative z-10">
                                <span className="text-[10px] font-black italic text-zinc-700 uppercase tracking-[0.3em]">Access Protocol</span>
                                <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-white text-zinc-500 group-hover:text-black transition-all">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Performance Monitoring */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-12 space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight underline adorn-indigo-500 decoration-4">Transmission Pulse</h3>
                        <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-widest">Global delivery effectiveness matrix.</p>
                    </div>
                    <Link href="/dashboard/analytics">
                        <button className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            Deep Analytics <BarChart3 size={12} />
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            <span>Delivery Success Rate</span>
                            <span className="text-white">99.8%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.8%' }} />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest pt-4">
                            <span>Audience Health Score</span>
                            <span className="text-white">{analytics?.leads?.trend > 0 ? 'A+' : 'B+'}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: analytics?.leads?.trend > 0 ? '95%' : '80%' }} />
                        </div>
                    </div>

                    <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 flex items-center gap-6">
                        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                            <Clock className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase italic text-sm tracking-tight mb-1">Scheduled Operations</h4>
                            <p className="text-zinc-500 text-xs font-medium">System status: <span className="text-emerald-500 font-bold uppercase">Ready</span>. Next background sync in ~15 mins.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

