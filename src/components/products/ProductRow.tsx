'use client';

import React from 'react';
import {
    Eye, Edit, MoreVertical, Archive,
    Copy, Share2, Star, Users, TrendingUp, Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ProductRowProps {
    product: any;
    index: number;
    onArchive: (id: string) => void;
}

export default function ProductRow({ product, index, onArchive }: ProductRowProps) {
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-all group"
        >
            <input type="checkbox" className="rounded border-white/20 bg-zinc-800 text-indigo-500 w-4 h-4 cursor-pointer" />

            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-zinc-900 relative overflow-hidden border border-white/5 flex items-center justify-center text-xl shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                {getProductIcon(product.productType)}
            </div>

            {/* Name & Type */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                    {product.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                        {product.productType || 'Digital'}
                    </span>
                    {product.isFree && (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                            Free
                        </span>
                    )}
                </div>
            </div>

            {/* Pricing */}
            <div className="w-24 shrink-0">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Price</p>
                <p className="text-sm font-bold text-white">
                    {product.isFree ? 'Free' : `₹${(product.pricing?.basePrice / 100 || 0).toLocaleString()}`}
                </p>
            </div>

            {/* Sales Stats */}
            <div className="w-32 hidden md:block shrink-0">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Sales</p>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Users className="w-3 h-3" />
                        <span>{product.totalSales || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>₹{((product.totalSales || 0) * (product.pricing?.basePrice / 100 || 0)).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="w-28 shrink-0 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(product.status)} ${product.status === 'published' ? 'animate-pulse' : ''}`} />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{product.status}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <Link
                    href={`/dashboard/products/${product._id}`}
                    className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </Link>
                <Link
                    href={`/dashboard/products/${product._id}/edit`}
                    className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                    title="Edit Product"
                >
                    <Edit className="w-4 h-4" />
                </Link>
                <button
                    onClick={() => onArchive(product._id)}
                    className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-all"
                    title="Archive Product"
                >
                    <Archive className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
