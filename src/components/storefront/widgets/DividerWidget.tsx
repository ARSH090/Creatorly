'use client';

import React from 'react';
import type { DividerSettings, SpacerSettings } from '@/types/storefront-blocks.types';

interface DividerWidgetProps {
    settings: DividerSettings;
    theme: Record<string, string>;
}

interface SpacerWidgetProps {
    settings: SpacerSettings;
}

export function DividerWidget({ settings, theme }: DividerWidgetProps) {
    const { style = 'line', color, width = 'full', thickness = 1 } = settings;
    const c = color || theme.textColor || '#ffffff';

    // Width mapping: center = 60%, short = 30%, full = 100%
    const maxW = width === 'short' ? '30%' : width === 'center' ? '60%' : '100%';

    if (style === 'wave') {
        return (
            <div className="w-full flex justify-center py-3" style={{ color: c }}>
                <div style={{ width: maxW }}>
                    <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="w-full h-5">
                        <path d="M0,10 C25,0 50,20 75,10 C100,0 125,20 150,10 C175,0 200,20 200,10" fill="none" stroke="currentColor" strokeWidth={thickness * 2} />
                    </svg>
                </div>
            </div>
        );
    }

    if (style === 'zigzag') {
        return (
            <div className="w-full flex justify-center py-3" style={{ color: c }}>
                <div style={{ width: maxW }}>
                    <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="w-full h-5">
                        <polyline points="0,10 20,0 40,10 60,0 80,10 100,0 120,10 140,0 160,10 180,0 200,10" fill="none" stroke="currentColor" strokeWidth={thickness * 2} />
                    </svg>
                </div>
            </div>
        );
    }

    if (style === 'dots') {
        return (
            <div className="w-full flex items-center justify-center gap-2 py-4">
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${c}66` }} />
                ))}
            </div>
        );
    }

    // Default: solid line
    return (
        <div className="w-full flex justify-center py-3">
            <hr
                style={{
                    width: maxW,
                    borderTopWidth: thickness,
                    borderTopColor: `${c}33`,
                    borderTopStyle: 'solid',
                }}
            />
        </div>
    );
}

export function SpacerWidget({ settings }: SpacerWidgetProps) {
    const { height = 40 } = settings;
    return <div style={{ height: `${height}px` }} aria-hidden="true" />;
}
