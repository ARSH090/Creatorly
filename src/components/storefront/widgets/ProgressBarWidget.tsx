'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { ProgressBarSettings } from '@/types/storefront-blocks.types';

interface Props {
    settings: ProgressBarSettings;
    theme: Record<string, string>;
}

export default function ProgressBarWidget({ settings, theme }: Props) {
    const percentage = Math.min(100, Math.max(0, settings.percentage || 0));

    const heights = {
        'slim': 'h-2',
        'default': 'h-4',
        'thick': 'h-8',
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-sm font-black uppercase tracking-widest" style={{ color: theme.textColor }}>
                    {settings.label || 'Progress'}
                </span>
                {settings.showPercentage !== false && (
                    <span className="text-xs font-mono font-bold" style={{ color: theme.primaryColor }}>
                        {percentage}%
                    </span>
                )}
            </div>

            <div
                className={`w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/5 ${heights[settings.style || 'default']}`}
            >
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="h-full relative"
                    style={{ backgroundColor: settings.color || theme.primaryColor }}
                >
                    {/* Animated shine effect */}
                    <motion.div
                        animate={{ x: ['100%', '-100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2"
                    />
                </motion.div>
            </div>
        </div>
    );
}
