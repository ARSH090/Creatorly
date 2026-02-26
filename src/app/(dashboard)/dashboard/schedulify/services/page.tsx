'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, MoreVertical, Clock, IndianRupee,
    Share2, Edit2, Copy, Pause, Play, Trash2, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ServicesList() {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Fetch services from /api/schedulify/services
        // Mocking for now
        setTimeout(() => {
            setServices([
                {
                    id: '1',
                    name: '1:1 Strategy Call',
                    duration: 60,
                    price: 2000,
                    bookings: 12,
                    status: 'active',
                    slug: 'strategy-call'
                },
                {
                    id: '2',
                    name: 'Portfolio Review',
                    duration: 30,
                    price: 1500,
                    bookings: 5,
                    status: 'active',
                    slug: 'portfolio-review'
                },
                {
                    id: '3',
                    name: 'Free Consultation',
                    duration: 15,
                    price: 0,
                    bookings: 28,
                    status: 'paused',
                    slug: 'free-consult'
                },
            ]);
            setIsLoading(false);
        }, 800);
    }, []);

    const toggleStatus = (id: string) => {
        setServices(services.map(s =>
            s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
        ));
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">My Services</h1>
                    <p className="text-zinc-500">Manage your bookable sessions and pricing.</p>
                </div>
                <Link href="/dashboard/schedulify/services/new" className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-lg shadow-white/5">
                    <Plus className="w-5 h-5" />
                    New Service
                </Link>
            </div>

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>
                <select className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-400 focus:outline-none">
                    <option>All Categories</option>
                    <option>Coaching</option>
                    <option>Consulting</option>
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service, i) => (
                    <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-zinc-900/50 rounded-3xl border border-white/5 p-6 flex flex-col group hover:border-indigo-500/20 transition-all hover:shadow-2xl hover:shadow-indigo-500/5"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${service.status === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-zinc-800 text-zinc-500 border-white/5'
                                    }`}>
                                    {service.status}
                                </span>
                                <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors capitalize">
                            {service.name}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-zinc-500 mb-6">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {service.duration} mins
                            </div>
                            <div className="flex items-center gap-1.5 font-bold text-zinc-400">
                                <IndianRupee className="w-3.5 h-3.5" />
                                {service.price === 0 ? 'Free' : service.price.toLocaleString('en-IN')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {service.bookings} bookings
                            </div>
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-3">
                            <Link href={`/dashboard/schedulify/services/edit/${service.id}`} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-xs font-bold transition-all border border-white/5">
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                            </Link>
                            <button
                                onClick={() => toggleStatus(service.id)}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${service.status === 'active'
                                        ? 'bg-zinc-800 text-zinc-400 border-white/5 hover:bg-zinc-700'
                                        : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/30'
                                    }`}
                            >
                                {service.status === 'active' ? (
                                    <><Pause className="w-3.5 h-3.5" /> Pause</>
                                ) : (
                                    <><Play className="w-3.5 h-3.5" /> Resume</>
                                )}
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Share Link</p>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredServices.length === 0 && (
                <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-white/10">
                    <div className="bg-zinc-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-500">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No services found</h3>
                    <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Create your first bookable service to start accepting meetings from your audience.</p>
                    <Link href="/dashboard/schedulify/services/new" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold transition-all">
                        <Plus className="w-5 h-5" />
                        Create Service
                    </Link>
                </div>
            )}
        </div>
    );
}
