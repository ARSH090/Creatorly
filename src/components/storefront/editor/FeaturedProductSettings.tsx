'use client';

import React from 'react';
import type { FeaturedProductSettings } from '@/types/storefront-blocks.types';
import { Field, Inp, BtnGroup, Toggle } from './HeroSettings';

interface Props {
    settings: FeaturedProductSettings;
    onChange: (patch: Partial<FeaturedProductSettings>) => void;
}

export default function FeaturedProductSettingsPanel({ settings, onChange }: Props) {
    const s = settings;

    return (
        <div className="p-4 space-y-5">
            <Field label="Product ID">
                <Inp
                    value={s.productId || ''}
                    onChange={v => onChange({ productId: v })}
                    placeholder="Enter Product ID (e.g. prod_...)"
                />
            </Field>

            <Field label="Layout Style">
                <BtnGroup
                    options={[
                        { v: 'vertical', l: 'Vertical' },
                        { v: 'horizontal', l: 'Horizontal' }
                    ]}
                    value={s.layout || 'vertical'}
                    onChange={v => onChange({ layout: v as any })}
                />
            </Field>

            <Field label="Badge Text">
                <Inp
                    value={s.badgeText || ''}
                    onChange={v => onChange({ badgeText: v })}
                    placeholder="e.g. Best Seller, New"
                />
            </Field>

            <Field label="Button Text">
                <Inp
                    value={s.buttonText || ''}
                    onChange={v => onChange({ buttonText: v })}
                    placeholder="Buy Now"
                />
            </Field>

            <Toggle
                label="Show Description"
                value={s.showDescription !== false}
                onChange={v => onChange({ showDescription: v })}
            />
        </div>
    );
}
