'use client';
import React from 'react';
import type { HeroSettings } from '@/types/storefront-blocks.types';

interface Props { settings: HeroSettings; onChange: (patch: Partial<HeroSettings>) => void; }

const TYPING_WORD_PRESETS = ['Creator', 'Coach', 'Developer', 'Designer', 'Educator', 'Entrepreneur', 'Artist'];

export default function HeroSettingsPanel({ settings, onChange }: Props) {
    const s = settings;

    const handleWordToggle = (word: string) => {
        const current = s.typingWords || [];
        const next = current.includes(word) ? current.filter(w => w !== word) : [...current, word];
        onChange({ typingWords: next });
    };

    return (
        <div className="p-4 space-y-5">
            <Field label="Display Name">
                <Inp value={s.displayName || ''} onChange={v => onChange({ displayName: v })} placeholder="Jane Creator" />
            </Field>

            <Field label="Bio / Tagline">
                <textarea
                    rows={3}
                    value={s.bio || ''}
                    onChange={e => onChange({ bio: e.target.value })}
                    maxLength={300}
                    className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-zinc-300 resize-none focus:outline-none focus:border-indigo-500/50 placeholder-zinc-700"
                    placeholder="Tell the world what you do…"
                />
                <p className="text-[10px] text-zinc-700 text-right">{(s.bio || '').length}/300</p>
            </Field>

            <Field label="Photo Shape">
                <BtnGroup
                    options={[{ v: 'circle', l: 'Circle' }, { v: 'square', l: 'Square' }, { v: 'rounded', l: 'Rounded' }]}
                    value={s.photoShape || 'circle'}
                    onChange={v => onChange({ photoShape: v as any })}
                />
            </Field>

            <Field label="Text Alignment">
                <BtnGroup
                    options={[{ v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' }]}
                    value={s.textAlign || 'center'}
                    onChange={v => onChange({ textAlign: v as any })}
                />
            </Field>

            <Field label="Typing Animation Words">
                <div className="flex flex-wrap gap-1.5">
                    {TYPING_WORD_PRESETS.map(w => {
                        const active = (s.typingWords || []).includes(w);
                        return (
                            <button
                                key={w}
                                onClick={() => handleWordToggle(w)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${active ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'
                                    }`}
                            >
                                {w}
                            </button>
                        );
                    })}
                </div>
            </Field>

            <Field label="CTA Button Text">
                <Inp value={s.ctaText || ''} onChange={v => onChange({ ctaText: v })} placeholder="Book a Call" />
            </Field>
            <Field label="CTA Button URL">
                <Inp value={s.ctaUrl || ''} onChange={v => onChange({ ctaUrl: v })} placeholder="https://calendly.com/..." />
            </Field>
            <Field label="CTA Style">
                <BtnGroup
                    options={[{ v: 'filled', l: 'Filled' }, { v: 'outline', l: 'Outline' }, { v: 'ghost', l: 'Ghost' }]}
                    value={s.ctaStyle || 'filled'}
                    onChange={v => onChange({ ctaStyle: v as any })}
                />
            </Field>

            <Field label="Cover Banner">
                <Inp value={s.coverImage || ''} onChange={v => onChange({ coverImage: v })} placeholder="https://... (image URL)" />
            </Field>

            <Toggle label="Show Username" value={s.showUsername !== false} onChange={v => onChange({ showUsername: v })} />
        </div>
    );
}

// Reusable mini components
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</p>
            {children}
        </div>
    );
}

export function Inp({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 placeholder-zinc-700"
        />
    );
}

export function BtnGroup({ options, value, onChange }: { options: { v: string; l: string }[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex gap-1.5">
            {options.map(({ v, l }) => (
                <button
                    key={v}
                    onClick={() => onChange(v)}
                    className={`flex-1 py-2 text-[10px] font-bold border rounded-xl transition-all ${value === v ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15 hover:text-zinc-400'
                        }`}
                >
                    {l}
                </button>
            ))}
        </div>
    );
}

export function Toggle({ label, value, onChange, description }: { label: string; value: boolean; onChange: (v: boolean) => void; description?: string }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-zinc-400">{label}</p>
                {description && <p className="text-[10px] text-zinc-700">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-indigo-500' : 'bg-zinc-800'}`}
            >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}
