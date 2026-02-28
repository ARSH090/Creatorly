'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Play, ExternalLink, Loader2, Search, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface DownloadableItem {
    _id: string;
    items: Array<{
        productId: string;
        name: string;
        type: string;
    }>;
    amount: number;
    createdAt: string;
    downloadCount: number;
    downloadLimit: number;
}

export default function DownloadsPage() {
    const [downloads, setDownloads] = useState<DownloadableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDownloads();
    }, []);

    const fetchDownloads = async () => {
        try {
            const res = await fetch('/api/user/orders?status=success');
            const data = await res.json();
            // Filter only digital/course/membership products
            setDownloads(data.orders || []);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredDownloads = downloads.filter(order =>
        order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tight italic uppercase">My Library</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">Access all your purchased digital assets and courses.</p>
                    </div>

                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-white/20 transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-[10px] font-black tracking-widest uppercase">Fetching your library...</p>
                    </div>
                ) : filteredDownloads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDownloads.map((order) => {
                            const item = order.items[0]; // Assuming single item for now or just listing the main one
                            return (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 space-y-6 hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-white/5">
                                            {item.type === 'course' ? <Play className="w-6 h-6 text-indigo-400" /> : <FileText className="w-6 h-6 text-emerald-400" />}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Purchased</p>
                                            <p className="text-xs font-bold text-zinc-300">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold leading-tight line-clamp-2">{item.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                    {order.downloadLimit - order.downloadCount} DL Left
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <a
                                            href={item.type === 'course' ? `/u/shared/learn/${item.productId}` : `/api/delivery/${order._id}`}
                                            className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                                        >
                                            {item.type === 'course' ? <Play className="w-4 h-4 fill-black" /> : <Download className="w-4 h-4" />}
                                            {item.type === 'course' ? 'Start Course' : 'Download'}
                                        </a>
                                        <Link
                                            href={`/account/orders/${order._id}`}
                                            className="p-4 bg-zinc-800/30 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all border border-white/5"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 space-y-8 bg-[#0A0A0A] border border-white/5 border-dashed rounded-[3rem]">
                        <div className="w-20 h-20 bg-zinc-800/30 rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-10 h-10 text-zinc-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold italic uppercase tracking-tight">Your library is empty</h3>
                            <p className="text-zinc-500 text-sm font-medium">Start your journey by supporting your favorite creators.</p>
                        </div>
                        <Link
                            href="/explore"
                            className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all"
                        >
                            Explore Creators
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
