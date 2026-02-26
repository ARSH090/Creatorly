'use client';
import React from 'react';
import type { StorefrontBlock } from '@/types/storefront-blocks.types';
import { Field, Inp, Toggle } from './HeroSettings';

interface Props {
    block: StorefrontBlock;
    onChange: (p: Partial<StorefrontBlock['settings']>) => void;
}

export default function GenericSettings({ block, onChange }: Props) {
    const s = block.settings as any;

    // Render simple key/value editor for any block that doesn't have a custom panel yet
    return (
        <div className="p-4 space-y-4">
            {block.type === 'spacer' && (
                <Field label={`Height — ${s.height || 40}px`}>
                    <input type="range" min={8} max={200} step={4} value={s.height || 40}
                        onChange={e => onChange({ height: Number(e.target.value) } as any)}
                        className="w-full accent-indigo-500" />
                </Field>
            )}
            {block.type === 'divider' && (
                <>
                    <Field label="Style">
                        <div className="grid grid-cols-2 gap-1.5">
                            {(['line', 'dots', 'wave', 'zigzag'] as const).map(st => (
                                <button key={st} onClick={() => onChange({ style: st } as any)}
                                    className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${s.style === st ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                                    {st}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field label="Color">
                        <div className="flex items-center gap-3">
                            <input type="color" value={s.color || '#ffffff22'} onChange={e => onChange({ color: e.target.value } as any)}
                                className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/10 bg-transparent" />
                        </div>
                    </Field>
                </>
            )}
            {block.type === 'embed' && (
                <>
                    <Field label="Embed Code / iframe">
                        <textarea rows={6} value={s.code || ''} onChange={e => onChange({ code: e.target.value } as any)}
                            className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-zinc-300 resize-none focus:outline-none focus:border-indigo-500/50 font-mono placeholder-zinc-700"
                            placeholder='<iframe src="..." />' />
                    </Field>
                    <Field label={`Height — ${s.height || 400}px`}>
                        <input type="range" min={100} max={1000} step={50} value={s.height || 400}
                            onChange={e => onChange({ height: Number(e.target.value) } as any)}
                            className="w-full accent-indigo-500" />
                    </Field>
                </>
            )}
            {block.type === 'map' && (
                <>
                    <Field label="Google Maps Embed URL"><Inp value={s.embedUrl || ''} onChange={(v: string) => onChange({ embedUrl: v } as any)} placeholder="https://maps.google.com/maps?..." /></Field>
                    <Field label="Address Text"><Inp value={s.address || ''} onChange={(v: string) => onChange({ address: v } as any)} placeholder="123 Studio Lane, Mumbai" /></Field>
                    <Field label="Title"><Inp value={s.title || ''} onChange={(v: string) => onChange({ title: v } as any)} placeholder="Find Us" /></Field>
                    <Toggle label="Show Directions Button" value={s.showDirectionsButton !== false} onChange={v => onChange({ showDirectionsButton: v } as any)} />
                </>
            )}
            {block.type === 'booking' && (
                <>
                    <Field label="Calendar / Booking URL"><Inp value={s.calendarUrl || ''} onChange={(v: string) => onChange({ calendarUrl: v } as any)} placeholder="Calendly / Cal.com URL" /></Field>
                    <Field label="Title"><Inp value={s.title || ''} onChange={(v: string) => onChange({ title: v } as any)} placeholder="Book a Session" /></Field>
                    <Field label="Description"><Inp value={s.description || ''} onChange={(v: string) => onChange({ description: v } as any)} placeholder="Choose a time that works for you" /></Field>
                    <Toggle label="Show Inline Calendar" value={s.showInline !== false} onChange={v => onChange({ showInline: v } as any)} />
                </>
            )}
            {block.type === 'before_after' && (
                <>
                    <Field label="Before Image URL"><Inp value={s.beforeImage || ''} onChange={(v: string) => onChange({ beforeImage: v } as any)} placeholder="https://..." /></Field>
                    <Field label="After Image URL"><Inp value={s.afterImage || ''} onChange={(v: string) => onChange({ afterImage: v } as any)} placeholder="https://..." /></Field>
                    <Field label="Before Label"><Inp value={s.beforeLabel || 'Before'} onChange={(v: string) => onChange({ beforeLabel: v } as any)} placeholder="Before" /></Field>
                    <Field label="After Label"><Inp value={s.afterLabel || 'After'} onChange={(v: string) => onChange({ afterLabel: v } as any)} placeholder="After" /></Field>
                </>
            )}
            {block.type === 'music' && (
                <>
                    <Field label="Title"><Inp value={s.title || ''} onChange={(v: string) => onChange({ title: v } as any)} placeholder="Listen" /></Field>
                    <Field label="Spotify / Embed URL"><Inp value={s.tracks?.[0]?.embedUrl || ''} onChange={(v: string) => onChange({ tracks: [{ id: 't1', title: 'Track', embedUrl: v, platform: 'spotify' }] } as any)} placeholder="https://open.spotify.com/..." /></Field>
                </>
            )}
            {!['spacer', 'divider', 'embed', 'map', 'booking', 'before_after', 'music'].includes(block.type) && (
                <p className="text-xs text-zinc-600 text-center py-6">
                    Settings for <span className="font-bold text-zinc-400">{block.type}</span> are managed in dedicated panel.
                </p>
            )}
        </div>
    );
}
