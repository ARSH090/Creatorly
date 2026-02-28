'use client';

import React from 'react';
import type { EmbedSettings } from '@/types/storefront-blocks.types';

interface EmbedWidgetProps {
    settings: EmbedSettings;
    theme: Record<string, string>;
}

function safeHtml(html: string): string {
    if (/<script/i.test(html)) return '<p style="color:red;font-size:12px">Unsafe embed removed (contains scripts).</p>';
    return html;
}

export default function EmbedWidget({ settings, theme }: EmbedWidgetProps) {
    const { code, height = 500, title } = settings;
    const borderRadius = Number(theme.borderRadius || 12);

    if (!code) {
        return (
            <div className="text-center py-10 opacity-30">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>Paste an embed code</p>
            </div>
        );
    }

    // If it's a plain URL (not iframe/HTML), wrap in iframe
    const isPlainUrl = /^https?:\/\//.test(code.trim()) && !code.includes('<');

    return (
        <div className="w-full overflow-hidden" style={{ borderRadius }}>
            {title && (
                <h3 className="text-base font-bold mb-3" style={{ color: theme.textColor }}>{title}</h3>
            )}
            {isPlainUrl ? (
                <iframe
                    src={code.trim()}
                    className="w-full"
                    style={{ height, border: 'none' }}
                    allow="payment; microphone; camera"
                    title={title || 'Embedded content'}
                    loading="lazy"
                />
            ) : (
                <div
                    className="w-full"
                    style={{ minHeight: height }}
                    dangerouslySetInnerHTML={{ __html: safeHtml(code) }}
                />
            )}
        </div>
    );
}
