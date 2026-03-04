'use client';

import React from 'react';
import type { SocialFeedSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup } from './HeroSettings';
import { Plus, X } from 'lucide-react';

interface Props {
    settings: SocialFeedSettings;
    onChange: (patch: Partial<SocialFeedSettings>) => void;
}

export default function SocialFeedSettingsPanel({ settings, onChange }: Props) {
    const s = settings;

    const addUrl = () => {
        const currentUrls = s.urls || [];
        if (currentUrls.length >= 6) return;
        onChange({ urls: [...currentUrls, ''] });
    };

    const updateUrl = (idx: number, val: string) => {
        const currentUrls = [...(s.urls || [])];
        currentUrls[idx] = val;
        onChange({ urls: currentUrls });
    };

    const removeUrl = (idx: number) => {
        const currentUrls = [...(s.urls || [])];
        currentUrls.splice(idx, 1);
        onChange({ urls: currentUrls });
    };

    return (
        <div className="p-4 space-y-6">
            <Field label="Platform">
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { v: 'instagram', l: 'Instagram' },
                        { v: 'twitter', l: 'Twitter' },
                        { v: 'tiktok', l: 'TikTok' },
                        { v: 'youtube', l: 'YouTube' },
                        { v: 'spotify', l: 'Spotify' },
                        { v: 'pinterest', l: 'Pinterest' },
                        { v: 'linkedin', l: 'LinkedIn' },
                        { v: 'substack', l: 'Substack' }
                    ].map(opt => (
                        <button
                            key={opt.v}
                            onClick={() => onChange({ platform: opt.v as any })}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${s.platform === opt.v
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                }`}
                        >
                            {opt.l}
                        </button>
                    ))}
                </div>
            </Field>

            <Field label="Feed Title">
                <Inp
                    value={s.title || ''}
                    onChange={v => onChange({ title: v })}
                    placeholder="Latest on TikTok"
                />
            </Field>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Post/Video URLs</label>
                    <button
                        onClick={addUrl}
                        className="p-1 hover:bg-white/5 rounded-full transition-colors"
                        title="Add URL"
                    >
                        <Plus size={14} className="text-indigo-500" />
                    </button>
                </div>

                {(s.urls || []).map((url, idx) => (
                    <div key={idx} className="flex gap-2">
                        <Inp
                            value={url}
                            onChange={v => updateUrl(idx, v)}
                            placeholder="https://..."
                        />
                        <button
                            onClick={() => removeUrl(idx)}
                            className="p-3 bg-white/5 hover:bg-red-500/10 rounded-xl transition-colors text-zinc-500 hover:text-red-500"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {(!s.urls || s.urls.length === 0) && (
                    <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-zinc-600">No URLs added. Add up to 6 links.</p>
                    </div>
                )}
            </div>

            <Field label="Layout Type">
                <BtnGroup
                    options={[
                        { v: 'grid', l: 'Grid' },
                        { v: 'carousel', l: 'Carousel' }
                    ]}
                    value={s.layout || 'grid'}
                    onChange={v => onChange({ layout: v as any })}
                />
            </Field>

            {s.layout !== 'carousel' && (
                <Field label="Grid Columns">
                    <BtnGroup
                        options={[
                            { v: '1', l: '1' },
                            { v: '2', l: '2' },
                            { v: '3', l: '3' }
                        ]}
                        value={String(s.columns || 3)}
                        onChange={v => onChange({ columns: Number(v) as any })}
                    />
                </Field>
            )}

            <Field label="Aspect Ratio">
                <BtnGroup
                    options={[
                        { v: '1/1', l: 'Square' },
                        { v: '16/9', l: 'Video' },
                        { v: '9/16', l: 'Reels' },
                        { v: 'auto', l: 'Auto' }
                    ]}
                    value={s.aspectRatio || '1/1'}
                    onChange={v => onChange({ aspectRatio: v as any })}
                />
            </Field>

            <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400">Show Follow Button</span>
                    <input
                        type="checkbox"
                        checked={s.showFollowButton ?? true}
                        onChange={e => onChange({ showFollowButton: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-0"
                    />
                </div>

                {s.showFollowButton !== false && (
                    <>
                        <Field label="Follow Text">
                            <Inp
                                value={s.followButtonText || 'Follow'}
                                onChange={v => onChange({ followButtonText: v })}
                            />
                        </Field>
                        <Field label="Follow URL">
                            <Inp
                                value={s.followUrl || ''}
                                onChange={v => onChange({ followUrl: v })}
                                placeholder="Your profile link"
                            />
                        </Field>
                    </>
                )}
            </div>
        </div>
    );
}
