'use client';

import React, { useState, useEffect } from "react";
import {
    ShoppingCart, Clock, Mail, TrendingUp,
    Users, DollarSign, AlertCircle, RefreshCw,
    Send, Eye, Filter, Calendar, BarChart3,
    CheckCircle2, XCircle, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AbandonedCheckoutManagement() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [checkouts, setCheckouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("30d");
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        fetchAnalytics();
    }, [timeframe]);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`/api/abandoned-checkout?timeframe=${timeframe}`);
            const data = await res.json();
            setAnalytics(data.data);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const sendRecoveryEmail = async (checkoutId: string, emailType: 'first' | 'second') => {
        try {
            const res = await fetch('/api/abandoned-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkoutId, emailType })
            });
            
            if (res.ok) {
                // Refresh data
                fetchAnalytics();
            }
        } catch (error) {
            console.error("Failed to send recovery email:", error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tightest mb-2 flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-amber-500" />
                        Abandoned Checkout Recovery
                    </h1>
                    <p className="text-zinc-500 font-medium">Recover lost sales with automated email sequences</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-zinc-900/50 border border-white/5 text-white px-4 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <button
                        onClick={fetchAnalytics}
                        className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-4 py-2 rounded-xl font-medium hover:bg-zinc-800 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                {timeframe}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-1">{analytics.totalAbandoned}</h3>
                        <p className="text-sm text-zinc-400">Abandoned Checkouts</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                Recovered
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-1">{analytics.totalRecovered}</h3>
                        <p className="text-sm text-zinc-400">Successful Recoveries</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                Rate
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-1">{analytics.recoveryRate}%</h3>
                        <p className="text-sm text-zinc-400">Recovery Rate</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                Revenue
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-1">{formatCurrency(analytics.totalRecoveredValue)}</h3>
                        <p className="text-sm text-zinc-400">Recovered Revenue</p>
                    </motion.div>
                </div>
            )}

            {/* Recovery Tips */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border border-white/5 p-8 rounded-3xl">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-black text-white mb-2">Recovery Tips</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-zinc-300">
                            <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                <span>First email sent 1 hour after abandonment with 15% discount</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                <span>Second email sent 24 hours later with 25% discount</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span>Average recovery rate: 15-25% across all creators</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Templates Preview */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-white uppercase italic">Email Templates</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-white">First Recovery Email</h3>
                                <p className="text-xs text-zinc-500">Sent 1 hour after abandonment</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-600" />
                                <span className="text-zinc-300">Timing: 1 hour after abandonment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-zinc-600" />
                                <span className="text-zinc-300">Discount: 15% off</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-zinc-600" />
                                <span className="text-zinc-300">Expires: 48 hours</span>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-black/40 rounded-xl">
                            <p className="text-xs text-zinc-400 mb-2">Subject Preview:</p>
                            <p className="text-sm text-white font-medium">"Complete your purchase of [Product Name]"</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-white">Second Recovery Email</h3>
                                <p className="text-xs text-zinc-500">Sent 24 hours after abandonment</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-600" />
                                <span className="text-zinc-300">Timing: 24 hours after abandonment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-zinc-600" />
                                <span className="text-zinc-300">Discount: 25% off</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-zinc-600" />
                                <span className="text-zinc-300">Expires: 24 hours</span>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-black/40 rounded-xl">
                            <p className="text-xs text-zinc-400 mb-2">Subject Preview:</p>
                            <p className="text-sm text-white font-medium">"Still thinking about [Product Name]? Here's 25% off!"</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Status */}
            <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-white">System Status</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-zinc-300">Automated recovery emails: Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-zinc-300">Cron job: Running hourly</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-zinc-300">Email templates: Configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-zinc-300">Email service: Placeholder (TODO)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
