'use client';

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import type { BeforeAfterSettings } from '@/types/storefront-blocks.types';

interface BeforeAfterWidgetProps {
    settings: BeforeAfterSettings;
    theme: Record<string, string>;
}

export default function BeforeAfterWidget({ settings, theme }: BeforeAfterWidgetProps) {
    const { beforeImage, afterImage, beforeLabel = 'Before', afterLabel = 'After' } = settings;
    const [position, setPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const borderRadius = Number(theme.borderRadius || 12);
    const primaryColor = theme.primaryColor || '#6366f1';

    const updatePosition = useCallback((clientX: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        setPosition(Math.round(x * 100));
    }, []);

    if (!beforeImage || !afterImage) {
        return (
            <div className="text-center py-10 opacity-30">
                <p className="text-4xl mb-2">🔄</p>
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>Add Before &amp; After images</p>
            </div>
        );
    }

    return (
        <div className="w-full py-2">
            <div
                ref={containerRef}
                className="relative select-none overflow-hidden aspect-video cursor-col-resize"
                style={{ borderRadius }}
                onMouseDown={() => { dragging.current = true; }}
                onMouseMove={(e) => { if (dragging.current) updatePosition(e.clientX); }}
                onMouseUp={() => { dragging.current = false; }}
                onMouseLeave={() => { dragging.current = false; }}
                onTouchMove={(e) => { updatePosition(e.touches[0].clientX); }}
            >
                {/* After (underlying full image) */}
                <Image src={afterImage} alt={afterLabel} fill className="object-cover" />

                {/* Before (clipped left portion) */}
                <div
                    className="absolute inset-0"
                    style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                >
                    <Image src={beforeImage} alt={beforeLabel} fill className="object-cover" />
                </div>

                {/* Slider line */}
                <div
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{ left: `${position}%`, backgroundColor: primaryColor, transform: 'translateX(-50%)' }}
                >
                    {/* Handle */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-xl"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <svg viewBox="0 0 24 24" width={18} height={18} fill="white">
                            <path d="M8 5l-7 7 7 7V5zm8 0l7 7-7 7V5z" />
                        </svg>
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-sm pointer-events-none">
                    {beforeLabel}
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-sm pointer-events-none">
                    {afterLabel}
                </div>
            </div>
        </div>
    );
}
