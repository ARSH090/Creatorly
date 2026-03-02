'use client';

import React from 'react';
import type { PricingTableSettings } from '@/types/storefront-blocks.types';
import { Field, Inp } from './HeroSettings';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface Props {
    settings: PricingTableSettings;
    onChange: (patch: Partial<PricingTableSettings>) => void;
}

export default function PricingTableSettingsPanel({ settings, onChange }: Props) {
    const s = settings;

    const updatePlan = (id: string, patch: any) => {
        const next = (s.plans || []).map(p => p.id === id ? { ...p, ...patch } : p);
        onChange({ plans: next });
    };

    const addPlan = () => {
        const next = [
            ...(s.plans || []),
            {
                id: `plan_${Date.now()}`,
                name: 'New Plan',
                price: '₹0',
                features: ['Feature 1'],
                buttonText: 'Buy Now'
            }
        ];
        onChange({ plans: next });
    };

    const removePlan = (id: string) => {
        onChange({ plans: (s.plans || []).filter(p => p.id !== id) });
    };

    return (
        <div className="p-4 space-y-6">
            <Field label="Table Title">
                <Inp
                    value={s.title || ''}
                    onChange={v => onChange({ title: v })}
                    placeholder="Choose Your Plan"
                />
            </Field>

            <div className="space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Plans</p>

                {s.plans?.map((plan, idx) => (
                    <div key={plan.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 relative group">
                        <button
                            onClick={() => removePlan(plan.id)}
                            className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <Inp value={plan.name} onChange={v => updatePlan(plan.id, { name: v })} placeholder="Plan Name" />
                            <Inp value={plan.price} onChange={v => updatePlan(plan.id, { price: v })} placeholder="Price" />
                        </div>

                        <textarea
                            rows={2}
                            value={plan.features.join('\n')}
                            onChange={e => updatePlan(plan.id, { features: e.target.value.split('\n') })}
                            className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none focus:border-indigo-500/30"
                            placeholder="One feature per line"
                        />

                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => updatePlan(plan.id, { isFeatured: !plan.isFeatured })}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${plan.isFeatured ? 'bg-indigo-500 text-white' : 'text-zinc-600'}`}
                            >
                                <CheckCircle2 size={10} /> {plan.isFeatured ? 'Featured' : 'Mark Featured'}
                            </button>
                            <Inp value={plan.buttonText || ''} onChange={v => updatePlan(plan.id, { buttonText: v })} placeholder="Button Text" />
                        </div>
                    </div>
                ))}

                <button
                    onClick={addPlan}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> Add Plan
                </button>
            </div>
        </div>
    );
}
