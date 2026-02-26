'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { FAQSettings, FAQItem } from '@/types/storefront-blocks.types';
import { Field, Inp, Toggle } from './HeroSettings';

interface Props { settings: FAQSettings; onChange: (p: Partial<FAQSettings>) => void; }

const newFAQ = (): FAQItem => ({ id: `faq_${Date.now()}`, question: '', answer: '' });

export default function FAQSettingsPanel({ settings, onChange }: Props) {
    const items = settings.items || [];
    const update = (idx: number, patch: Partial<FAQItem>) =>
        onChange({ items: items.map((f, i) => i === idx ? { ...f, ...patch } : f) });
    const remove = (idx: number) => onChange({ items: items.filter((_, i) => i !== idx) });

    return (
        <div className="p-4 space-y-5">
            <Field label="Section Title">
                <Inp value={settings.title || ''} onChange={v => onChange({ title: v })} placeholder="Frequently Asked Questions" />
            </Field>
            <Toggle label="Default First FAQ Open" value={settings.defaultOpen === true} onChange={v => onChange({ defaultOpen: v })} />
            <Toggle label="Show Search Bar" value={settings.showSearch === true} onChange={v => onChange({ showSearch: v })} />
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Questions ({items.length})</p>
                <button onClick={() => onChange({ items: [...items, newFAQ()] })} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg">
                    <Plus size={11} /> Add
                </button>
            </div>
            {items.map((faq, idx) => (
                <div key={faq.id} className="border border-white/8 bg-black/20 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-zinc-600">Q{idx + 1}</span>
                        <button onClick={() => remove(idx)} className="text-zinc-700 hover:text-rose-400"><Trash2 size={12} /></button>
                    </div>
                    <Field label="Question"><Inp value={faq.question} onChange={v => update(idx, { question: v })} placeholder="How does it work?" /></Field>
                    <Field label="Answer">
                        <textarea rows={3} value={faq.answer} onChange={e => update(idx, { answer: e.target.value })}
                            className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2 text-xs text-zinc-300 resize-none focus:outline-none focus:border-indigo-500/50 placeholder-zinc-700"
                            placeholder="Your detailed answer…" />
                    </Field>
                    <Field label="Category (optional)"><Inp value={faq.category || ''} onChange={v => update(idx, { category: v })} placeholder="General, Payments, etc." /></Field>
                </div>
            ))}
        </div>
    );
}
