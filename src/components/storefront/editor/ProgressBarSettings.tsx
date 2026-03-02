'use client';

import React from 'react';
import type { ProgressBarSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup, Toggle } from './HeroSettings';

interface Props {
    settings: ProgressBarSettings;
    onChange: (patch: Partial<ProgressBarSettings>) => void;
}

export default function ProgressBarSettingsPanel({ settings, onChange }: Props) {
    const s = settings;

    return (
        <div className="p-4 space-y-5">
            <Field label="Goal Label">
                <Inp
                    value={s.label || ''}
                    onChange={v => onChange({ label: v })}
                    placeholder="e.g. Fundraising Goal"
                />
            </Field>

            <Field label={`Completion — ${s.percentage || 0}%`}>
                <input
                    type="range" min={0} max={100} step={1}
                    value={s.percentage || 0}
                    onChange={e => onChange({ percentage: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                />
            </Field>

            <Field label="Bar Color">
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={s.color || '#6366f1'}
                        onChange={e => onChange({ color: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/10 bg-transparent"
                    />
                    <Inp value={s.color || '#6366f1'} onChange={v => onChange({ color: v })} placeholder="#hex" />
                </div>
            </Field>

            <Field label="Bar Style">
                <BtnGroup
                    options={[
                        { v: 'slim', l: 'Slim' },
                        { v: 'default', l: 'Default' },
                        { v: 'thick', l: 'Thick' }
                    ]}
                    value={s.style || 'default'}
                    onChange={v => onChange({ style: v as any })}
                />
            </Field>

            <Toggle
                label="Show Percentage Label"
                value={s.showPercentage !== false}
                onChange={v => onChange({ showPercentage: v })}
            />
        </div>
    );
}
