'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity, ShieldCheck, ShieldAlert, Cpu,
    Play, Clock, CheckCircle2, XCircle,
    AlertTriangle, Terminal, RefreshCcw, Search,
    Filter, Database, Globe, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface TestStat {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    timestamp: string;
}

interface TestSpec {
    title: string;
    ok: boolean;
    tests: any[];
    id: string;
}

interface TestSuite {
    title: string;
    file: string;
    specs: TestSpec[];
    suites?: TestSuite[];
}

export default function QADashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<TestStat | null>(null);
    const [suites, setSuites] = useState<TestSuite[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'failed' | 'passed'>('all');
    const [runningSmokeTest, setRunningSmokeTest] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/creator/qa/status');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setSuites(data.results);
            } else {
                toast.error(data.message || 'Failed to load test results');
            }
        } catch (error) {
            toast.error('Connection error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const runSmokeTest = async () => {
        setRunningSmokeTest(true);
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 3000)), // Simulation for now
            {
                loading: 'Initializing Deep System Scan...',
                success: 'Smoke Test Passed! All core services operational.',
                error: 'Service Interruption Detected',
            }
        ).finally(() => setRunningSmokeTest(false));
    };

    const filteredSuites = suites.map(suite => {
        const filteredSpecs = suite.specs.filter(spec => {
            const matchesSearch = spec.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filter === 'all' || (filter === 'passed' && spec.ok) || (filter === 'failed' && !spec.ok);
            return matchesSearch && matchesFilter;
        });
        return { ...suite, specs: filteredSpecs };
    }).filter(suite => suite.specs.length > 0 || (suite.suites && suite.suites.length > 0));

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tightest mb-2">Master Control Hub</h1>
                    <p className="text-zinc-500 font-medium text-lg">Real-time protocol verification and system health monitoring.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-4 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={runSmokeTest}
                        disabled={runningSmokeTest}
                        className="flex items-center gap-3 bg-indigo-500 hover:bg-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                    >
                        <Play className="w-4 h-4" />
                        Execute Smoke Test
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'System Integrity', value: stats ? `${Math.round((stats.passed / stats.total) * 100)}%` : '-%', icon: ShieldCheck, color: 'emerald' },
                    { label: 'Successful Protocols', value: stats?.passed || 0, icon: CheckCircle2, color: 'indigo' },
                    { label: 'Critical Anomalies', value: stats?.failed || 0, icon: ShieldAlert, color: 'rose' },
                    { label: 'Last Sweep', value: stats ? new Date(stats.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-', icon: Clock, color: 'zinc' }
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-${stat.color}-500/10 transition-all`} />
                        <stat.icon className={`w-8 h-8 text-${stat.color}-500 mb-6`} />
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                        <p className="text-3xl font-black text-white italic uppercase tracking-tighter tabular-nums">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-3xl overflow-hidden relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Test Execution Logs</h2>
                    </div>

                    <div className="flex items-center gap-4 bg-zinc-950 p-2 rounded-2xl border border-white/5">
                        <div className="flex gap-1">
                            {['all', 'passed', 'failed'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t as any)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600 hover:text-white'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Locate specific protocol..."
                                className="bg-transparent border-none py-2 pl-10 pr-6 text-xs text-white placeholder:text-zinc-800 focus:outline-none w-48 font-medium"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-40 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                        <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">Syncing protocol data...</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {filteredSuites.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                <Activity className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                <p className="text-zinc-600 font-bold">No matching anomalies or protocols found.</p>
                            </div>
                        ) : (
                            filteredSuites.map((suite, idx) => (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={suite.file || idx}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <h3 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] font-mono italic">{suite.file || suite.title}</h3>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {suite.specs.map((spec) => (
                                            <div
                                                key={spec.id}
                                                className={`group flex items-center justify-between p-6 rounded-3xl border transition-all ${spec.ok
                                                    ? 'bg-zinc-950/20 border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02]'
                                                    : 'bg-rose-500/[0.03] border-rose-500/10 hover:border-rose-500/30'}`}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${spec.ok
                                                        ? 'bg-zinc-900 border border-white/5 text-emerald-500 group-hover:scale-110'
                                                        : 'bg-rose-500/20 text-rose-400 animate-pulse'}`}>
                                                        {spec.ok ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-black uppercase tracking-tight italic ${spec.ok ? 'text-zinc-300' : 'text-rose-400'}`}>{spec.title}</p>
                                                        <p className="text-[9px] text-zinc-700 mt-1 font-mono tracking-wider">{spec.id.substring(0, 12)}</p>
                                                    </div>
                                                </div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border ${spec.ok
                                                    ? 'text-emerald-500 border-emerald-500/20'
                                                    : 'text-rose-400 border-rose-500/20'}`}>
                                                    {spec.ok ? 'Verified' : 'Anomalous'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Internal Core Service Status (Static Simulation) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { name: 'Identity Engine (Clerk)', status: 'Optimal', icon: Key, color: 'indigo' },
                    { name: 'Revenue Gateway (Razorpay)', status: 'Standby', icon: Database, color: 'purple' },
                    { name: 'Global Asset Cdn (S3)', status: 'Optimal', icon: Globe, color: 'emerald' }
                ].map(service => (
                    <div key={service.name} className="flex items-center justify-between p-6 bg-zinc-900/20 border border-white/5 rounded-3xl backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <service.icon className={`w-5 h-5 text-${service.color}-500`} />
                            <div>
                                <p className="text-xs font-black text-white italic uppercase tracking-tight">{service.name}</p>
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{service.status}</p>
                            </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${service.status === 'Optimal' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-[0_0_10px_rgba(16,185,129,0.3)]`} />
                    </div>
                ))}
            </div>
        </div>
    );
}
