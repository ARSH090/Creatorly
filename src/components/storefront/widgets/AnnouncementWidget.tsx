'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AnnouncementSettings } from '@/types/storefront-blocks.types';

interface AnnouncementWidgetProps {
    settings: AnnouncementSettings;
    theme: Record<string, string>;
}

export default function AnnouncementWidget({ settings, theme }: AnnouncementWidgetProps) {
    const {
        text = 'Announcement',
        emoji,
        ctaText,
        ctaUrl,
        bgColor,
        bgGradient,
        dismissable = true,
        sticky = false,
        scheduleStart,
        scheduleEnd,
    } = settings;

    const [dismissed, setDismissed] = useState(false);

    // Schedule check
    const now = new Date();
    if (scheduleStart && new Date(scheduleStart) > now) return null;
    if (scheduleEnd && new Date(scheduleEnd) < now) return null;
    if (dismissed) return null;

    const bg = bgGradient || bgColor || theme.primaryColor || '#6366f1';
    const txtColor = '#fff';

    const content = (
        <div
            className="w-full px-4 py-3 flex items-center justify-center gap-4 text-sm font-semibold"
            style={{
                background: bg,
                color: txtColor,
            }}
        >
            {emoji && <span className="text-lg">{emoji}</span>}
            <span>{text}</span>
            {ctaText && ctaUrl && (
                <a
                    href={ctaUrl}
                    className="underline underline-offset-2 font-black hover:opacity-80 transition-opacity"
                >
                    {ctaText} →
                </a>
            )}
            {dismissable && (
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );

    if (sticky) {
        return (
            <div className="sticky top-0 z-50 w-full">
                {content}
            </div>
        );
    }

    return content;
}
