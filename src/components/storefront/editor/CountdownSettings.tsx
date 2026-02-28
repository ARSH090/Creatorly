'use client';
import React from 'react';
import type { CountdownSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup, Toggle } from './HeroSettings';

interface Props { settings: CountdownSettings; onChange: (p: Partial<CountdownSettings>) => void; }

export default function CountdownSettingsPanel({ settings, onChange }: Props) {
    return (
        <div className="p-4 space-y-5">
            <Field label="Target Date & Time">
                <input type="datetime-local" value={settings.targetDate || ''}
                    onChange={e => onChange({ targetDate: e.target.value })}
                    className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50" />
            </Field>
            <Field label="Display Style">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['flip', 'digital', 'minimal', 'circle'] as const).map(s => (
                        <button key={s} onClick={() => onChange({ style: s })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.style === s ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </Field>
            <Field label="Label / Heading">
                <Inp value={settings.label || ''} onChange={v => onChange({ label: v })} placeholder="Offer ends in…" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
                <Toggle label="Days" value={settings.showDays !== false} onChange={v => onChange({ showDays: v })} />
                <Toggle label="Hours" value={settings.showHours !== false} onChange={v => onChange({ showHours: v })} />
                <Toggle label="Minutes" value={settings.showMinutes !== false} onChange={v => onChange({ showMinutes: v })} />
                <Toggle label="Seconds" value={settings.showSeconds !== false} onChange={v => onChange({ showSeconds: v })} />
            </div>
            <Field label="When Expired">
                <div className="grid grid-cols-3 gap-1.5">
                    {(['hide', 'message', 'redirect'] as const).map(o => (
                        <button key={o} onClick={() => onChange({ onExpire: o })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.onExpire === o ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {o}
                        </button>
                    ))}
                </div>
            </Field>
            {settings.onExpire === 'message' && (
                <Field label="Expire Message">
                    <Inp value={settings.expireMessage || ''} onChange={v => onChange({ expireMessage: v })} placeholder="The offer has ended." />
                </Field>
            )}
            {settings.onExpire === 'redirect' && (
                <Field label="Redirect URL">
                    <Inp value={settings.expireUrl || ''} onChange={v => onChange({ expireUrl: v })} placeholder="https://..." />
                </Field>
            )}
        </div>
    );
}
