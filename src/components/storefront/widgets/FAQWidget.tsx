'use client';

import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { FAQSettings } from '@/types/storefront-blocks.types';

interface FAQWidgetProps {
    settings: FAQSettings;
    theme: Record<string, string>;
}

export default function FAQWidget({ settings, theme }: FAQWidgetProps) {
    const { items = [], defaultOpen = false, showSearch = false, title = 'Frequently Asked Questions' } = settings;
    const [openIds, setOpenIds] = useState<string[]>(defaultOpen && items.length ? [items[0].id] : []);
    const [query, setQuery] = useState('');
    const borderRadius = Number(theme.borderRadius || 12);

    const filtered = query
        ? items.filter(it =>
            it.question.toLowerCase().includes(query.toLowerCase()) ||
            it.answer.toLowerCase().includes(query.toLowerCase())
        )
        : items;

    const toggle = (id: string) => setOpenIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

    return (
        <section className="w-full py-4">
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: theme.textColor || '#fff' }}>
                    {title}
                </h2>
                <div className="h-px flex-1 opacity-10" style={{ backgroundColor: theme.textColor || '#fff' }} />
            </div>

            {showSearch && (
                <div
                    className="flex items-center gap-2 px-4 py-3 mb-4"
                    style={{
                        backgroundColor: theme.cardColor || 'rgba(255,255,255,0.04)',
                        borderRadius,
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <Search size={16} className="opacity-40" style={{ color: theme.textColor }} />
                    <input
                        type="text"
                        placeholder="Search FAQs..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm placeholder-current"
                        style={{ color: theme.textColor || '#fff', opacity: query ? 1 : 0.7 }}
                    />
                </div>
            )}

            <div className="space-y-2">
                {filtered.map(item => {
                    const isOpen = openIds.includes(item.id);
                    return (
                        <div
                            key={item.id}
                            className="overflow-hidden transition-all"
                            style={{
                                backgroundColor: theme.cardColor || 'rgba(255,255,255,0.03)',
                                borderRadius,
                                border: `1px solid ${isOpen ? `${theme.primaryColor || '#6366f1'}44` : 'rgba(255,255,255,0.06)'}`,
                            }}
                        >
                            <button
                                onClick={() => toggle(item.id)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                            >
                                <span className="font-bold text-sm leading-snug" style={{ color: theme.textColor || '#fff' }}>
                                    {item.question}
                                </span>
                                <ChevronDown
                                    size={18}
                                    className="flex-shrink-0 transition-transform duration-200"
                                    style={{
                                        color: theme.primaryColor || '#6366f1',
                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    }}
                                />
                            </button>
                            <div
                                className="overflow-hidden transition-all duration-200"
                                style={{ maxHeight: isOpen ? 500 : 0 }}
                            >
                                <p
                                    className="px-5 pb-4 text-sm leading-relaxed opacity-70"
                                    style={{ color: theme.textColor || '#fff' }}
                                >
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <p className="text-center py-6 text-sm opacity-40" style={{ color: theme.textColor }}>
                    No FAQs match your search
                </p>
            )}
        </section>
    );
}
