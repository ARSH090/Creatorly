'use client';

import React from 'react';
import type { ImageBlockSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup } from './HeroSettings';

interface Props {
    settings: ImageBlockSettings;
    onChange: (patch: Partial<ImageBlockSettings>) => void;
}

export default function SingleImageSettingsPanel({ settings, onChange }: Props) {
    const s = settings;

    return (
        <div className="p-4 space-y-5">
            <Field label="Image URL">
                <Inp
                    value={s.url || ''}
                    onChange={v => onChange({ url: v })}
                    placeholder="https://images.unsplash.com/..."
                />
            </Field>

            <Field label="Link URL (Optional)">
                <Inp
                    value={s.link || ''}
                    onChange={v => onChange({ link: v })}
                    placeholder="https://yourlink.com"
                />
            </Field>

            <Field label="Aspect Ratio">
                <BtnGroup
                    options={[
                        { v: 'auto', l: 'Auto' },
                        { v: 'square', l: '1:1' },
                        { v: '16:9', l: '16:9' },
                        { v: '4:3', l: '4:3' }
                    ]}
                    value={s.aspectRatio || 'auto'}
                    onChange={v => onChange({ aspectRatio: v as any })}
                />
            </Field>

            <Field label={`Corner Radius — ${s.borderRadius ?? 24}px`}>
                <input
                    type="range" min={0} max={48} step={4}
                    value={s.borderRadius ?? 24}
                    onChange={e => onChange({ borderRadius: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                />
            </Field>

            <Field label="Alt Text / Caption">
                <Inp
                    value={s.caption || ''}
                    onChange={v => onChange({ caption: v, alt: v })}
                    placeholder="Description or caption..."
                />
            </Field>
        </div>
    );
}
