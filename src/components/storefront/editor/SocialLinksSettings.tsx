'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { SocialLinksSettings, SocialLink } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup } from './HeroSettings';

interface Props { settings: SocialLinksSettings; onChange: (p: Partial<SocialLinksSettings>) => void; }

const ALL_PLATFORMS = [
    'instagram', 'youtube', 'twitter', 'tiktok', 'facebook', 'linkedin', 'pinterest',
    'snapchat', 'telegram', 'whatsapp', 'discord', 'twitch', 'reddit', 'github', 'gitlab',
    'behance', 'dribbble', 'figma', 'producthunt', 'medium', 'substack', 'hashnode', 'devto',
    'spotify', 'applemusic', 'soundcloud', 'bandcamp', 'patreon', 'kofi', 'buymeacoffee',
    'gumroad', 'amazon', 'flipkart', 'threads', 'mastodon', 'bluesky', 'website', 'email',
    'phone', 'calendly', 'topmate', 'linktree', 'etsy', 'shopify',
];

export default function SocialLinksSettingsPanel({ settings, onChange }: Props) {
    const links = settings.links || [];

    const update = (idx: number, patch: Partial<SocialLink>) => {
        onChange({ links: links.map((l, i) => i === idx ? { ...l, ...patch } : l) });
    };

    const add = (platform: string) => {
        if (links.find(l => l.platform === platform)) return;
        onChange({ links: [...links, { platform, url: '', isVisible: true }] });
    };

    const remove = (idx: number) => onChange({ links: links.filter((_, i) => i !== idx) });

    return (
        <div className="p-4 space-y-5">
            <Field label="Display Mode">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['icons', 'icons_label', 'full_button', 'floating'] as const).map(m => (
                        <button key={m} onClick={() => onChange({ displayMode: m })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.displayMode === m ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {m.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </Field>

            <Field label="Icon Size">
                <BtnGroup options={[{ v: 'sm', l: 'S' }, { v: 'md', l: 'M' }, { v: 'lg', l: 'L' }]}
                    value={settings.iconSize || 'md'} onChange={v => onChange({ iconSize: v as any })} />
            </Field>

            <Field label="Icon Shape">
                <BtnGroup options={[{ v: 'circle', l: 'Circle' }, { v: 'square', l: 'Square' }, { v: 'rounded', l: 'Rounded' }]}
                    value={settings.shape || 'circle'} onChange={v => onChange({ shape: v as any })} />
            </Field>

            <Field label="Hover Effect">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['scale', 'bounce', 'rotate', 'glow'] as const).map(e => (
                        <button key={e} onClick={() => onChange({ hoverEffect: e })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.hoverEffect === e ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {e}
                        </button>
                    ))}
                </div>
            </Field>

            {/* Quick add platform */}
            <Field label="Add Platform">
                <div className="flex flex-wrap gap-1">
                    {ALL_PLATFORMS.filter(p => !links.find(l => l.platform === p)).slice(0, 20).map(p => (
                        <button key={p} onClick={() => add(p)}
                            className="px-2 py-1 rounded-lg bg-white/3 border border-white/8 text-[9px] font-bold text-zinc-600 hover:border-indigo-500/40 hover:text-indigo-400 transition-all capitalize">
                            {p}
                        </button>
                    ))}
                </div>
            </Field>

            {/* Links list */}
            <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Your Links ({links.length})</p>
                {links.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-xl px-3 py-2">
                        <span className="text-[10px] font-bold text-zinc-400 capitalize w-20 flex-shrink-0 truncate">{link.platform}</span>
                        <input
                            className="flex-1 min-w-0 bg-transparent text-[11px] text-zinc-400 placeholder-zinc-700 focus:outline-none"
                            value={link.url}
                            onChange={e => update(idx, { url: e.target.value })}
                            placeholder="https://..."
                        />
                        <button onClick={() => remove(idx)} className="text-zinc-700 hover:text-rose-400">
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
