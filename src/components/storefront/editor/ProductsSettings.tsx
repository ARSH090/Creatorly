'use client';
import React from 'react';
import type { ProductsSettings } from '@/types/storefront-blocks.types';
import { Field, BtnGroup, Inp, Toggle } from './HeroSettings';

interface Props { settings: ProductsSettings; onChange: (p: Partial<ProductsSettings>) => void; }

export default function ProductsSettingsPanel({ settings, onChange }: Props) {
    return (
        <div className="p-4 space-y-5">
            <Field label="Section Title">
                <Inp value={settings.title || ''} onChange={v => onChange({ title: v })} placeholder="My Products" />
            </Field>
            <Field label="Layout">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['grid', 'list', 'carousel', 'masonry'] as const).map(l => (
                        <button key={l} onClick={() => onChange({ layout: l })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.layout === l ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {l}
                        </button>
                    ))}
                </div>
            </Field>

            {settings.layout === 'grid' && (
                <Field label="Columns">
                    <BtnGroup
                        options={[{ v: '2', l: '2 Col' }, { v: '3', l: '3 Col' }, { v: '4', l: '4 Col' }]}
                        value={String(settings.columns || 3)}
                        onChange={v => onChange({ columns: Number(v) as 2 | 3 | 4 })}
                    />
                </Field>
            )}

            <Field label="Card Style">
                <div className="grid grid-cols-3 gap-1.5">
                    {(['minimal', 'detailed', 'compact'] as const).map(s => (
                        <button key={s} onClick={() => onChange({ cardStyle: s })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.cardStyle === s ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </Field>

            <Field label="Sort By">
                <select value={settings.sortBy || 'manual'} onChange={e => onChange({ sortBy: e.target.value as any })}
                    className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50">
                    <option value="manual">Manual (drag to sort)</option>
                    <option value="newest">Newest First</option>
                    <option value="bestseller">Best Sellers First</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="price_desc">Price: High → Low</option>
                </select>
            </Field>

            <Field label="Max Visible">
                <input type="number" min={1} max={50} value={settings.maxVisible || 6}
                    onChange={e => onChange({ maxVisible: Number(e.target.value) })}
                    className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50" />
            </Field>

            <Toggle label="Show 'View All' Button" value={settings.showViewAll !== false} onChange={v => onChange({ showViewAll: v })} />
        </div>
    );
}
