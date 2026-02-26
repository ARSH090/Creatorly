'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Clock, CheckCircle2, XCircle,
    MoreVertical, ExternalLink, Mail, Phone, Calendar,
    ChevronLeft, ChevronRight, FileText, Download, UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingsListPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    useEffect(() => {
        // Mocking bookings
        setTimeout(() => {
            setBookings([
                {
                    id: '1',
                    clientName: 'Rahul Sharma',
                    clientEmail: 'rahul@gmail.com',
                    clientPhone: '+91 98765 43210',
                    service: '1:1 Strategy Call',
                    date: '2026-03-05',
                    time: '15:00',
                    duration: 60,
                    status: 'confirmed',
                    payment: 'paid',
                    amount: 2000,
                    meetingLink: 'https://zoom.us/j/123456789',
                    customQA: 'I want to grow to 100K followers'
                },
                {
                    id: '2',
                    clientName: 'Priya Patel',
                    clientEmail: 'priya@gmail.com',
                    service: 'Portfolio Review',
                    date: '2026-03-06',
                    time: '11:30',
                    duration: 30,
                    status: 'confirmed',
                    payment: 'paid',
                    amount: 1500
                },
                {
                    id: '3',
                    clientName: 'Arjun Das',
                    clientEmail: 'arjun@gmail.com',
                    service: 'Free Consultation',
                    date: '2026-02-28',
                    time: '10:00',
                    duration: 15,
                    status: 'completed',
                    payment: 'free',
                    amount: 0
                }
            ]);
            setIsLoading(false);
        }, 800);
    }, []);

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.service.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeTab === 'upcoming') return matchesSearch && b.status === 'confirmed';
        if (activeTab === 'completed') return matchesSearch && b.status === 'completed';
        if (activeTab === 'cancelled') return matchesSearch && b.status === 'cancelled';
        return matchesSearch;
    });

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Bookings</h1>
                    <p className="text-zinc-500">View and manage all your scheduled sessions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-zinc-900 border border-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-zinc-800 transition-all">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all">
                        Manual Booking
                    </button>
                </div>
            </div>

            {/* Tabs & Filters */}
            <div className="bg-zinc-900/50 p-2 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center p-1 bg-black rounded-xl border border-white/5 w-full md:w-auto">
                    {['upcoming', 'completed', 'cancelled', 'all'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="Search by client or service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 transition-all outline-none"
                    />
                </div>
            </div>

            {/* List Table */}
            <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Client</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Service</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Date & Time</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Payment</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredBookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                                    onClick={() => setSelectedBooking(booking)}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                                                {booking.clientName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{booking.clientName}</p>
                                                <p className="text-[10px] text-zinc-600 font-medium">{booking.clientEmail}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-zinc-400">
                                        {booking.service}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-white">{new Date(booking.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {booking.time} ({booking.duration}m)
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {booking.amount > 0 ? (
                                            <div>
                                                <p className="text-sm font-bold text-emerald-400">₹{booking.amount}</p>
                                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">via Razorpay</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Free</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${booking.status === 'confirmed'
                                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                : booking.status === 'completed'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            }`}>
                                            {booking.status === 'confirmed' && <Clock className="w-2.5 h-2.5" />}
                                            {booking.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                            {booking.status === 'cancelled' && <XCircle className="w-2.5 h-2.5" />}
                                            {booking.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Detail Sidebar Component (Mocked inside for now) */}
            <AnimatePresence>
                {selectedBooking && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-[#0A0A0A] border-l border-white/10 z-[101] shadow-2xl p-8 overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-white capitalize">Booking Details</h2>
                                <button onClick={() => setSelectedBooking(null)} className="p-2 bg-zinc-900 rounded-xl border border-white/5 text-zinc-500 hover:text-white transition-all">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Header Card */}
                                <div className="bg-indigo-500 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-80">Confirmed Session</p>
                                    <h3 className="text-2xl font-black mb-1">{selectedBooking.service}</h3>
                                    <div className="flex items-center gap-4 mt-4 opacity-100">
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {selectedBooking.date}
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold">
                                            <Clock className="w-3.5 h-3.5" />
                                            {selectedBooking.time}
                                        </div>
                                    </div>

                                    {selectedBooking.meetingLink && (
                                        <a
                                            href={selectedBooking.meetingLink}
                                            target="_blank"
                                            className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Join Meeting
                                        </a>
                                    )}
                                </div>

                                {/* Client Info Section */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-zinc-600 uppercase tracking-widest px-2">Client Information</h4>
                                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-xl">
                                                {selectedBooking.clientName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-white">{selectedBooking.clientName}</p>
                                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Member since Feb 2024</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <a href={`mailto:${selectedBooking.clientEmail}`} className="flex items-center gap-3 p-3 bg-black rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all group">
                                                <Mail className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400" />
                                                <span className="text-xs text-zinc-300 truncate">{selectedBooking.clientEmail}</span>
                                            </a>
                                            {selectedBooking.clientPhone && (
                                                <div className="flex items-center gap-3 p-3 bg-black rounded-2xl border border-white/5">
                                                    <Phone className="w-4 h-4 text-zinc-600" />
                                                    <span className="text-xs text-zinc-300">{selectedBooking.clientPhone}</span>
                                                </div>
                                            )}
                                        </div>

                                        {selectedBooking.customQA && (
                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Pre-Call Note</p>
                                                <p className="text-xs text-zinc-300 italic italic leading-relaxed">
                                                    &quot;{selectedBooking.customQA}&quot;
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-zinc-600 uppercase tracking-widest px-2">Payment Details</h4>
                                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-white">₹{selectedBooking.amount.toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Paid via Razorpay</p>
                                        </div>
                                        <button className="text-xs font-bold text-indigo-400 hover:underline">View Receipt</button>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div className="space-y-4 pb-12">
                                    <h4 className="text-xs font-black text-zinc-600 uppercase tracking-widest px-2">Private Notes</h4>
                                    <textarea
                                        className="w-full bg-black border border-white/5 rounded-3xl p-5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-all resize-none min-h-[120px]"
                                        placeholder="Add notes about clinical discussion or follow-ups..."
                                    />
                                    <button className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all">
                                        Save Notes
                                    </button>
                                </div>

                                {/* Danger Zone / Actions */}
                                <div className="grid grid-cols-2 gap-4 pb-20">
                                    <button className="py-4 bg-white/5 border border-white/5 rounded-2xl font-bold text-xs text-zinc-400 hover:text-white transition-all uppercase tracking-widest">
                                        Reschedule
                                    </button>
                                    <button className="py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl font-bold text-xs text-rose-500 hover:bg-rose-500/20 transition-all uppercase tracking-widest">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
