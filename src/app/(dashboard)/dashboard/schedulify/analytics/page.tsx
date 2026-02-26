'use client';

import React from 'react';
import {
    TrendingUp, Users, Clock, IndianRupee,
    BarChart3, PieChart, Activity, ArrowUpRight,
    Calendar, Download
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SchedulifyAnalytics() {
    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Analytics</h1>
                    <p className="text-zinc-500">Track your booking performance and revenue metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="bg-zinc-900 border border-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-xs outline-none">
                        <option>Last 30 Days</option>
                        <option>Last Quarter</option>
                        <option>This Year</option>
                    </select>
                    <button className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all">
                        <Download className="w-4 h-4" /> Download Report
                    </button>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: '₹94,000', change: '+12.5%', icon: IndianRupee, color: 'text-emerald-400' },
                    { label: 'Total Bookings', value: '147', change: '+8.2%', icon: Users, color: 'text-indigo-400' },
                    { label: 'Booking Rate', value: '64%', change: '+3.1%', icon: Activity, color: 'text-amber-400' },
                    { label: 'Avg. Value', value: '₹1,250', change: '+5.0%', icon: TrendingUp, color: 'text-purple-400' },
                ].map((stat, i) => (
                    <div key={stat.label} className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{stat.change}</span>
                        </div>
                        <p className="text-sm text-zinc-500">{stat.label}</p>
                        <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart Placeholder */}
                <div className="lg:col-span-2 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 p-8 h-[400px] flex flex-col relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white">Revenue Growth</h3>
                            <p className="text-xs text-zinc-500">Daily revenue generated from bookings</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-xs">Revenue (₹)</span>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end gap-2 pb-4">
                        {[40, 60, 45, 70, 85, 55, 90, 100, 80, 65, 75, 95].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: i * 0.05, duration: 0.8 }}
                                className="flex-1 bg-gradient-to-t from-indigo-500/20 to-indigo-500 rounded-lg group-hover:to-indigo-400 transition-all relative cursor-pointer"
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                    ₹{h * 100}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Service Popularity */}
                <div className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">Popular Services</h3>
                    <div className="space-y-6">
                        {[
                            { name: '1:1 Strategy Call', bookings: 84, color: 'bg-indigo-500' },
                            { name: 'Portfolio Review', bookings: 42, color: 'bg-purple-500' },
                            { name: 'Consultation', bookings: 21, color: 'bg-emerald-500' },
                        ].map((s) => (
                            <div key={s.name} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-zinc-400">{s.name}</span>
                                    <span className="text-white">{s.bookings} Bookings</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(s.bookings / 147) * 100}%` }}
                                        className={`h-full ${s.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-8">
                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-indigo-500/10 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Deep Insights</p>
                                <p className="text-xs text-zinc-300 font-bold flex items-center gap-1">
                                    View Comprehensive Report <ArrowUpRight className="w-3 h-3" />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
