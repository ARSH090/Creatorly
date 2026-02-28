'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { TestimonialsSettings, Testimonial } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup } from './HeroSettings';

interface Props { settings: TestimonialsSettings; onChange: (p: Partial<TestimonialsSettings>) => void; }

const newT = (): Testimonial => ({ id: `t_${Date.now()}`, name: '', content: '', rating: 5, role: '' });

export default function TestimonialsSettingsPanel({ settings, onChange }: Props) {
    const items = settings.items || [];
    const update = (idx: number, patch: Partial<Testimonial>) =>
        onChange({ items: items.map((t, i) => i === idx ? { ...t, ...patch } : t) });
    const remove = (idx: number) => onChange({ items: items.filter((_, i) => i !== idx) });

    return (
        <div className="p-4 space-y-5">
            <Field label="Title">
                <Inp value={settings.title || ''} onChange={v => onChange({ title: v })} placeholder="What People Say" />
            </Field>
            <Field label="Display Mode">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['grid', 'carousel', 'masonry', 'wall'] as const).map(m => (
                        <button key={m} onClick={() => onChange({ displayMode: m })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.displayMode === m ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {m}
                        </button>
                    ))}
                </div>
            </Field>
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Testimonials ({items.length})</p>
                <button onClick={() => onChange({ items: [...items, newT()] })} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg">
                    <Plus size={11} /> Add
                </button>
            </div>
            {items.map((t, idx) => (
                <div key={t.id} className="border border-white/8 bg-black/20 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-500">#{idx + 1}</span>
                        <button onClick={() => remove(idx)} className="text-zinc-700 hover:text-rose-400"><Trash2 size={12} /></button>
                    </div>
                    <Field label="Name"><Inp value={t.name} onChange={v => update(idx, { name: v })} placeholder="Customer Name" /></Field>
                    <Field label="Role"><Inp value={t.role || ''} onChange={v => update(idx, { role: v })} placeholder="Product Designer" /></Field>
                    <Field label="Review">
                        <textarea rows={2} value={t.content} onChange={e => update(idx, { content: e.target.value })}
                            className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2 text-xs text-zinc-300 resize-none focus:outline-none focus:border-indigo-500/50 placeholder-zinc-700"
                            placeholder="Their review…" />
                    </Field>
                    <Field label="Rating (1–5)">
                        <BtnGroup
                            options={[1, 2, 3, 4, 5].map(n => ({ v: String(n), l: '★'.repeat(n) }))}
                            value={String(t.rating || 5)}
                            onChange={v => update(idx, { rating: Number(v) })}
                        />
                    </Field>
                    <Field label="Photo URL"><Inp value={t.avatar || ''} onChange={v => update(idx, { avatar: v })} placeholder="https://..." /></Field>
                </div>
            ))}
        </div>
    );
}
