'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExplorePage() {
    const [creators, setCreators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchCreators() {
            try {
                const res = await fetch('/api/explore/creators');
                const data = await res.json();
                setCreators(data.creators || []);
            } catch (error) {
                console.error('Failed to fetch creators:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchCreators();
    }, []);

    const filteredCreators = creators.filter(c =>
        c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#030303] text-white pt-32 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto px-6 space-y-20">
                {/* Hero Header */}
                <div className="max-w-3xl space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                        <Sparkles size={12} /> Live Marketplace
                    </div>
                    <h1 className="text-7xl font-black uppercase tracking-tighter italic leading-[0.9]">
                        EXPERIENCE <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500">THE BEST</span> <br />
                        CREATORS.
                    </h1>
                    <p className="text-xl text-zinc-500 font-medium max-w-xl">
                        Discover elite digital products, courses, and exclusive communities from the world's most influential voices.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-xl group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                            <Search className="w-5 h-5 text-zinc-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find a creator or product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 bg-[#0A0A0A] border border-white/5 rounded-2xl pl-16 pr-6 text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                {/* Creators Grid */}
                <div className="space-y-12">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600">Featured Creators</h2>
                        <div className="h-px flex-1 bg-white/5 mx-12 hidden md:block" />
                    </div>

                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Syncing Creators...</p>
                        </div>
                    ) : filteredCreators.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {filteredCreators.map((creator, idx) => (
                                    <motion.div
                                        key={creator.username}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group"
                                    >
                                        <Link href={`/u/${creator.username}`}>
                                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 space-y-8 hover:border-indigo-500/30 transition-all active:scale-[0.98]">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 rounded-3xl bg-zinc-800 relative overflow-hidden ring-4 ring-black shadow-2xl">
                                                        {creator.avatar && (
                                                            <img src={creator.avatar} alt={creator.username} className="object-cover w-full h-full" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold group-hover:text-indigo-400 transition-colors">{creator.displayName}</h3>
                                                        <p className="text-xs font-black text-zinc-600 uppercase tracking-widest mt-1">@{creator.username}</p>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                                                    {creator.description || 'No description provided.'}
                                                </p>

                                                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        <span className="text-xs font-black uppercase tracking-widest">Editor's Choice</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="h-96 flex items-center justify-center border border-dashed border-white/10 rounded-[3rem]">
                            <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">No creators found matching your search</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
