'use client';

import React from 'react';
import Image from 'next/image';
import { LucideIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon?: LucideIcon;
    imageUrl?: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ icon: Icon, imageUrl, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

            <div className="relative w-32 h-32 flex items-center justify-center">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        width={128}
                        height={128}
                        className="object-contain drop-shadow-[0_20px_40px_rgba(124,58,237,0.2)]"
                    />
                ) : Icon && (
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-500 shadow-2xl shadow-indigo-500/10">
                        <Icon size={40} strokeWidth={1.5} />
                    </div>
                )}
            </div>

            <div className="space-y-2 max-w-sm">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
            </div>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-3 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                >
                    <Plus size={18} strokeWidth={3} />
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
}
