'use client';

import React, { useState, useEffect } from 'react';
import {
    CalendarDays, Users, CheckCircle2, IndianRupee,
    Plus, Settings, Share2, Video, Copy, ExternalLink,
    ChevronRight, ArrowUpRight, Clock
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function SchedulifyOverview() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        upcoming: 0,
        completed: 0,
        revenue: 0
    });
    const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mock data for now, real implementation will fetch from /api/schedulify/stats
        setTimeout(() => {
            setStats({
                total: 47,
                upcoming: 8,
                completed: 39,
                revenue: 94000
            });
            setUpcomingBookings([
                { id: '1', client: 'Rahul Sharma', service: '1:1 Strategy Call', time: 'Today, 3:00 PM', status: 'confirmed' },
                { id: '2', client: 'Priya Patel', service: 'Portfolio Review', time: 'Tomorrow, 11:30 AM', status: 'confirmed' },
                { id: '3', client: 'Arjun Das', service: '1:1 Strategy Call', time: 'Feb 25, 4:00 PM', status: 'confirmed' },
            ]);
            setActivity([
                { id: 'a1', text: 'New booking: Rahul booked 1:1 Call for March 5', time: '2 mins ago' },
                { id: 'a2', text: 'Payment received: ₹2,000 from Priya', time: '1 hour ago' },
                { id: 'a3', text: 'Booking cancelled: Arjun — March 3', time: '3 hours ago' },
            ]);
            setIsLoading(false);
        }, 1000);
    }, []);

    const bookingUrl = typeof window !== 'undefined' ? `${window.location.host}/u/${user?.username}/book` : '';

    const copyBookingUrl = () => {
        navigator.clipboard.writeText(bookingUrl);
        // Toast or notification here
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header section with live URL */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                    <CalendarDays className="w-32 h-32" />
                </div>

                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                        <CalendarDays className="w-8 h-8 text-indigo-400" />
                        Schedulify
                    </h1>
                    <p className="text-zinc-500 mb-6 max-w-lg">
                        Your professional booking system is ready. Share your link to start receiving scheduled calls and payments.
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-4">
                            <span className="text-sm font-medium text-zinc-400">creatorly.link/{user?.username}/book</span>
                            <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                                <button onClick={copyBookingUrl} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                    <Copy className="w-4 h-4" />
                                </button>
                                <a href={`/u/${user?.username}/book`} target="_blank" className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Bookings', value: stats.total, icon: Users, color: 'text-indigo-400' },
                    { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-amber-400' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Revenue Earned', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-white' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Last 30 Days</span>
                        </div>
                        <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-4">
                <Link href="/dashboard/schedulify/services/new" className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 transition-all">
                    <Plus className="w-4 h-4" />
                    New Service
                </Link>
                <Link href="/dashboard/schedulify/availability" className="bg-zinc-900 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all">
                    <Settings className="w-4 h-4" />
                    Set Availability
                </Link>
                <Link href="/dashboard/schedulify/calendar" className="bg-zinc-900 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all">
                    <CalendarDays className="w-4 h-4" />
                    View Calendar
                </Link>
                <Link href="/dashboard/schedulify/integrations/zoom" className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-500/20 transition-all">
                    <Video className="w-4 h-4" />
                    Connect Zoom
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Bookings List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Upcoming Bookings</h3>
                        <Link href="/dashboard/schedulify/bookings" className="text-xs text-indigo-400 font-bold flex items-center gap-1 hover:underline">
                            View All <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${booking.time.includes('Today')
                                        ? 'bg-indigo-500/5 border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                                        : 'bg-zinc-900/50 border-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${booking.time.includes('Today') ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-500'
                                        }`}>
                                        {booking.client.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{booking.client}</p>
                                        <p className="text-xs text-zinc-500">{booking.service}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${booking.time.includes('Today') ? 'text-indigo-400' : 'text-zinc-400'}`}>
                                        {booking.time}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Reschedule</button>
                                        <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 space-y-8 relative overflow-hidden">
                        <div className="absolute left-9 top-10 bottom-10 w-[1px] bg-white/5" />

                        {activity.map((item) => (
                            <div key={item.id} className="flex gap-4 relative z-10">
                                <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                                    <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-300 leading-snug">{item.text}</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1.5">{item.time}</p>
                                </div>
                            </div>
                        ))}

                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-zinc-400 transition-all border border-white/5">
                            Show All Activity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
