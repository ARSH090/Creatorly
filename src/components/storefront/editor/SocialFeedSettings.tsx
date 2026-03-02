'use client';

import React from 'react';
import type { SocialFeedSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup } from './HeroSettings';

interface Props {
    settings: SocialFeedSettings;
    onChange: (patch: Partial<SocialFeedSettings>) => void;
}

export default function SocialFeedSettingsPanel({ settings, onChange }: Props) {
    const s = settings;

    return (
        <div className="p-4 space-y-5">
            <Field label="Platform">
                <BtnGroup
                    options={[
                        { v: 'instagram', l: 'Instagram' },
                        { v: 'twitter', l: 'Twitter' },
                        { v: 'tiktok', l: 'TikTok' }
                    ]}
                    value={s.platform || 'instagram'}
                    onChange={v => onChange({ platform: v as any })}
                />
            </Field>

            <Field label="Username / Handle">
                <Inp
                    value={s.username || ''}
                    onChange={v => onChange({ username: v })}
                    placeholder="@username"
                />
            </Field>

            <Field label="Layout">
                <BtnGroup
                    options={[
                        { v: 'grid', l: 'Grid' },
                        { v: 'carousel', l: 'Carousel' }
                    ]}
                    value={s.layout || 'grid'}
                    onChange={v => onChange({ layout: v as any })}
                />
            </Field>

            <Field label={`Count Limit — ${s.limit || 6} Posts`}>
                <input
                    type="range" min={3} max={12} step={1}
                    value={s.limit || 6}
                    onChange={e => onChange({ limit: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                />
            </Field>
        </div>
    );
}
