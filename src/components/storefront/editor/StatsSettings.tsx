'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { StatsSettings, StatItem } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup, Toggle } from './HeroSettings';

interface Props { settings: StatsSettings; onChange: (p: Partial<StatsSettings>) => void; }

const newStat = (): StatItem => ({ id: `stat_${Date.now()}`, number: '10K+', label: 'Students' });

export default function StatsSettingsPanel({ settings, onChange }: Props) {
    const items = settings.items || [];
    const update = (idx: number, patch: Partial<StatItem>) =>
        onChange({ items: items.map((s, i) => i === idx ? { ...s, ...patch } : s) });
    const remove = (idx: number) => onChange({ items: items.filter((_, i) => i !== idx) });

    return (
        <div className="p-4 space-y-5">
            <Field label="Title"><Inp value={settings.title || ''} onChange={v => onChange({ title: v })} placeholder="By the numbers" /></Field>
            <Field label="Layout">
                <BtnGroup options={[{ v: 'row', l: 'Row' }, { v: 'grid', l: 'Grid 2×3' }]}
                    value={settings.layout || 'row'} onChange={v => onChange({ layout: v as any })} />
            </Field>
            <Toggle label="Animate on Scroll" value={settings.animateOnScroll !== false} onChange={v => onChange({ animateOnScroll: v })} />
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Stats ({items.length})</p>
                <button onClick={() => onChange({ items: [...items, newStat()] })} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg">
                    <Plus size={11} /> Add
                </button>
            </div>
            {items.map((stat, idx) => (
                <div key={stat.id} className="border border-white/8 bg-black/20 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-[10px] text-zinc-600">Stat {idx + 1}</span>
                        <button onClick={() => remove(idx)} className="text-zinc-700 hover:text-rose-400"><Trash2 size={12} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Number / Value"><Inp value={stat.number} onChange={v => update(idx, { number: v })} placeholder="50K+" /></Field>
                        <Field label="Label"><Inp value={stat.label} onChange={v => update(idx, { label: v })} placeholder="Students" /></Field>
                        <Field label="Prefix"><Inp value={stat.prefix || ''} onChange={v => update(idx, { prefix: v })} placeholder="₹" /></Field>
                        <Field label="Suffix"><Inp value={stat.suffix || ''} onChange={v => update(idx, { suffix: v })} placeholder="+" /></Field>
                    </div>
                    <Field label="Icon (emoji or name)"><Inp value={stat.icon || ''} onChange={v => update(idx, { icon: v })} placeholder="🎓" /></Field>
                </div>
            ))}
        </div>
    );
}
