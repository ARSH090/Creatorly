'use client';
import React from 'react';
import type { VideoSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup, Toggle } from './HeroSettings';

interface Props { settings: VideoSettings; onChange: (p: Partial<VideoSettings>) => void; }

export default function VideoSettingsPanel({ settings, onChange }: Props) {
    return (
        <div className="p-4 space-y-5">
            <Field label="Video URL">
                <Inp value={settings.url || ''} onChange={v => onChange({ url: v })} placeholder="YouTube, Vimeo, or MP4 URL" />
            </Field>
            <Field label="Platform">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['youtube', 'instagram', 'vimeo', 'mp4'] as const).map(t => (
                        <button key={t} onClick={() => onChange({ type: t })}
                            className={`py-2 text-[9px] font-bold border rounded-xl capitalize transition-all ${settings.type === t ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-white/8 text-zinc-600 hover:border-white/15'}`}>
                            {t === 'mp4' ? 'MP4 Upload' : t}
                        </button>
                    ))}
                </div>
            </Field>
            <Field label="Aspect Ratio">
                <BtnGroup
                    options={[{ v: '16:9', l: '16:9' }, { v: '9:16', l: '9:16' }, { v: '1:1', l: '1:1' }, { v: '4:3', l: '4:3' }]}
                    value={settings.aspectRatio || '16:9'}
                    onChange={v => onChange({ aspectRatio: v as any })}
                />
            </Field>
            <Field label="Custom Thumbnail">
                <Inp value={settings.thumbnail || ''} onChange={v => onChange({ thumbnail: v })} placeholder="https://... (override thumbnail)" />
            </Field>
            <Field label="Title">
                <Inp value={settings.title || ''} onChange={v => onChange({ title: v })} placeholder="Video title" />
            </Field>
            <Toggle label="Autoplay (muted)" value={settings.autoplay !== false} onChange={v => onChange({ autoplay: v, muted: v })} />
            <Toggle label="Hide YouTube Branding" value={settings.showBranding === false} onChange={v => onChange({ showBranding: !v })} />
        </div>
    );
}
