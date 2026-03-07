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
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export default function ProductRow({ product, index, onArchive, isSelected, onSelect }: ProductRowProps) {
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'published': return 'bg-emerald-500';
            case 'draft': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]';
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
            className="flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-4 border-b border-white/5 hover:bg-white/[0.03] transition-all group relative overflow-hidden"
        >
            <div className="flex items-center gap-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(product._id)}
                    className="rounded border-white/20 bg-zinc-800 text-indigo-500 w-4 h-4 cursor-pointer focus:ring-offset-0 focus:ring-indigo-500"
                />

                {/* Thumbnail */}
                <div className="w-14 h-14 md:w-12 md:h-12 rounded-2xl bg-zinc-900 relative overflow-hidden border border-white/5 flex items-center justify-center text-xl shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                    {getProductIcon(product.productType)}
                </div>

                {/* Name & Type */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-sm font-black text-white truncate group-hover:text-indigo-400 transition-colors italic uppercase tracking-tighter">
                        {product.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                            {product.productType || 'Digital'}
                        </span>
                        {product.isFree && (
                            <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                                Free
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:contents gap-4">
                {/* Pricing */}
                <div className="md:w-24 shrink-0">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 md:mb-0.5 italic">Rate</p>
                    <p className="text-sm font-black text-white italic">
                        {product.isFree ? 'Free' : `₹${(product.pricing?.basePrice / 100 || 0).toLocaleString()}`}
                    </p>
                </div>

                {/* Sales Stats */}
                <div className="md:w-32 shrink-0">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 md:mb-0.5 italic text-right md:text-left">Traction</p>
                    <div className="flex items-center justify-end md:justify-start gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                            <Users className="w-3.5 h-3.5" />
                            <span>{product.totalSales || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>₹{((product.totalSales || 0) * (product.pricing?.basePrice / 100 || 0)).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="md:w-28 shrink-0 flex items-center md:justify-start gap-2 pt-4 md:pt-0 border-t border-white/5 md:border-0 col-span-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(product.status)} ${product.status === 'published' ? 'animate-pulse' : ''} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">{product.status}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end md:justify-start gap-2 pt-4 md:pt-0 border-t border-white/5 md:border-0 col-span-1">
                    <Link
                        href={`/dashboard/products/${product._id}/edit`}
                        className="p-2.5 rounded-xl bg-white/5 md:bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5 md:border-0"
                        title="Edit Product"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => onArchive(product._id)}
                        className="p-2.5 rounded-xl bg-white/5 md:bg-transparent hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-all border border-white/5 md:border-0"
                        title="Archive Product"
                    >
                        <Archive className="w-4 h-4" />
                    </button>
                    <Link
                        href={`/dashboard/products/${product._id}`}
                        className="p-2.5 rounded-xl bg-white/5 md:bg-transparent hover:bg-white/10 text-zinc-500 hover:text-indigo-400 transition-all border border-white/5 md:border-0"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
