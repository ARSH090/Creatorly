'use client';

import React from 'react';
import {
    Eye, Edit, Archive, Star,
    Users, TrendingUp, Zap, Copy, Share2
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ProductGridCardProps {
    product: any;
    index: number;
    onArchive: (id: string) => void;
}

export default function ProductGridCard({ product, index, onArchive }: ProductGridCardProps) {
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'published': return 'bg-emerald-500';
            case 'active': return 'bg-emerald-500';
            case 'draft': return 'bg-yellow-500';
            case 'paused': return 'bg-zinc-500';
            case 'archived': return 'bg-red-500';
            default: return 'bg-zinc-500';
        }
    };

    const getProductIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'ebook': return '📚';
            case 'course': return '🎓';
            case 'template': return '📄';
            case 'preset': return '🎨';
            case 'audio': return '🎵';
            case 'video': return '🎬';
            case 'bundle': return '📦';
            default: return '📄';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="group relative flex flex-col bg-zinc-900/40 border border-white/5 rounded-[2.5rem] hover:border-white/20 transition-all duration-500 hover:bg-zinc-900/60 overflow-hidden shadow-2xl"
        >
            {/* Image/Icon Area */}
            <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden rounded-t-[2.5rem] border-b border-white/5 flex items-center justify-center text-5xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-50" />
                <div className="relative z-10 filter drop-shadow-2xl">
                    {getProductIcon(product.productType)}
                </div>

                {/* Badges */}
                <div className="absolute top-5 left-5 flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            {product.productType || 'Digital'}
                        </span>
                    </div>
                    {product.isFree && (
                        <div className="bg-emerald-500/20 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Free</span>
                        </div>
                    )}
                </div>

                {/* Status Dot */}
                <div className={`absolute top-5 right-5 w-3 h-3 rounded-full ${getStatusColor(product.status)} ${product.status === 'published' ? 'animate-pulse' : ''} shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
            </div>

            <div className="p-7 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors line-clamp-1 tracking-tight">
                        {product.title}
                    </h3>
                    <div className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-lg border border-white/5">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-black text-white">{product.avgRating?.toFixed(1) || '0.0'}</span>
                    </div>
                </div>

                <p className="text-sm text-zinc-500 line-clamp-2 mb-6 font-medium leading-relaxed">
                    {product.shortDescription || product.description || 'Deliver high-quality value to your audience with this premium digital product.'}
                </p>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Sales</p>
                        <div className="flex items-center gap-2 text-white">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-sm font-bold">{product.totalSales || 0}</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Revenue</p>
                        <div className="flex items-center gap-2 text-emerald-400">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="text-sm font-bold">₹{((product.totalSales || 0) * (product.pricing?.basePrice / 100 || 0)).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Price</p>
                        <p className="text-2xl font-black text-white tracking-tighter">
                            {product.isFree ? 'Free' : `₹${(product.pricing?.basePrice / 100 || 0).toLocaleString()}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/dashboard/products/${product._id}/edit`}
                            className="bg-white text-black px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
                        >
                            Edit
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Action Overlay */}
            <div className="absolute top-20 right-5 flex flex-col gap-2 opacity-0 md:group-hover:opacity-100 transition-all translate-x-4 md:group-hover:translate-x-0 duration-500 group-active:opacity-100 group-active:translate-x-0">
                <button className="bg-black/80 backdrop-blur-2xl p-3.5 rounded-2xl border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl">
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onArchive(product._id);
                    }}
                    className="bg-black/80 backdrop-blur-2xl p-3.5 rounded-2xl border border-white/10 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shadow-2xl"
                >
                    <Archive className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
