'use client';

import React from 'react';
import type { CategoriesSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup, Toggle } from './HeroSettings';

interface Props {
    settings: CategoriesSettings;
    onChange: (patch: Partial<CategoriesSettings>) => void;
}

export default function CategoriesSettingsPanel({ settings, onChange }: Props) {
    const s = settings;

    return (
        <div className="p-4 space-y-5">
            <Field label="Section Title">
                <Inp
                    value={s.title || ''}
                    onChange={v => onChange({ title: v })}
                    placeholder="Browse Categories"
                />
            </Field>

            <Field label="Display Layout">
                <BtnGroup
                    options={[
                        { v: 'pills', l: 'Pills' },
                        { v: 'grid', l: 'Grid' },
                        { v: 'carousel', l: 'Carousel' }
                    ]}
                    value={s.layout || 'pills'}
                    onChange={v => onChange({ layout: v as any })}
                />
            </Field>

            <Field label="Specific Categories (IDs)">
                <Inp
                    value={s.categoryIds?.join(', ') || ''}
                    onChange={v => onChange({ categoryIds: v.split(',').map(id => id.trim()).filter(Boolean) })}
                    placeholder="cat_1, cat_2 (leave empty for all)"
                />
            </Field>

            <Toggle
                label="Show Item Count"
                value={s.showCount !== false}
                onChange={v => onChange({ showCount: v })}
            />
        </div>
    );
}
