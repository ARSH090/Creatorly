'use client';

import React from 'react';
import type { TextSettings } from '@/types/storefront-blocks.types';

interface TextWidgetProps {
    settings: TextSettings;
    theme: Record<string, string>;
}

const SIZE_MAP: Record<string, string> = { sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem' };
const MAX_W_MAP: Record<string, string> = { sm: '480px', md: '640px', lg: '800px', full: '100%' };
const ALIGN_MAP: Record<string, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };

export default function TextWidget({ settings, theme }: TextWidgetProps) {
    const {
        content = '',
        fontSize = 'md',
        textColor,
        bgColor,
        textAlign = 'left',
        maxWidth = 'md',
    } = settings;

    return (
        <div
            className="w-full py-4 px-2"
            style={{ backgroundColor: bgColor || undefined }}
        >
            <div
                className={`mx-auto prose prose-invert max-w-none ${ALIGN_MAP[textAlign] || 'text-left'}`}
                style={{
                    color: textColor || theme.textColor || '#fff',
                    fontSize: SIZE_MAP[fontSize] || '1rem',
                    maxWidth: MAX_W_MAP[maxWidth] || '640px',
                }}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    );
}
