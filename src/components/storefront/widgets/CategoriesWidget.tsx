'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tag, ChevronRight } from 'lucide-react';
import type { CategoriesSettings } from '@/types/storefront-blocks.types';

interface Props {
    settings: CategoriesSettings;
    theme: Record<string, string>;
}

export default function CategoriesWidget({ settings, theme }: Props) {
    // Mock categories for now, usually would be passed as a prop
    const categories = [
        { id: '1', name: 'Digital Courses', count: 12 },
        { id: '2', name: 'Design Assets', count: 45 },
        { id: '3', name: 'E-Books', count: 8 },
        { id: '4', name: 'Presets', count: 24 },
        { id: '5', name: 'Coaching', count: 3 },
    ].filter(c => !settings.categoryIds?.length || settings.categoryIds.includes(c.id));

    const isGrid = settings.layout === 'grid';
    const isPills = settings.layout === 'pills';

    return (
        <section className="space-y-6">
            {settings.title && (
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: theme.textColor }}>
                        {settings.title}
                    </h2>
                    <div className="h-px flex-1 bg-white/10" />
                </div>
            )}

            <div className={`
                ${isPills ? 'flex flex-wrap gap-3' : ''}
                ${isGrid ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : ''}
                ${settings.layout === 'carousel' ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-hide' : ''}
            `}>
                {categories.map((cat, idx) => (
                    <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            relative group transition-all duration-300
                            ${isPills ? 'px-6 py-3 rounded-full border text-sm font-bold bg-white/[0.03] hover:bg-white/[0.08]' : ''}
                            ${isGrid || settings.layout === 'carousel' ? 'p-6 rounded-3xl border bg-white/[0.03] hover:bg-white/[0.08] min-w-[160px] text-left' : ''}
                        `}
                        style={{
                            borderColor: theme.textColor + '11',
                            borderRadius: isPills ? '9999px' : `${Number(theme.borderRadius) * 1.5}px`
                        }}
                    >
                        <div className="flex flex-col gap-1">
                            {isGrid && <Tag className="mb-2 opacity-40" size={20} style={{ color: theme.primaryColor }} />}
                            <span className="text-zinc-200 group-hover:text-white transition-colors">
                                {cat.name}
                            </span>
                            {settings.showCount !== false && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                    {cat.count} Items
                                </span>
                            )}
                        </div>
                        {(isGrid || settings.layout === 'carousel') && (
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={16} className="text-zinc-600" />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>
        </section>
    );
}
