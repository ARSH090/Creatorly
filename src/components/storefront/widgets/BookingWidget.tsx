'use client';

import React from 'react';
import type { BookingSettings } from '@/types/storefront-blocks.types';
import { Calendar } from 'lucide-react';

interface BookingWidgetProps {
    settings: BookingSettings;
    theme: Record<string, string>;
}

export default function BookingWidget({ settings, theme }: BookingWidgetProps) {
    const { calendarUrl, title = 'Book a Session', description, buttonText = 'Book Now', showInline = true } = settings;
    const borderRadius = Number(theme.borderRadius || 12);
    const primaryColor = theme.primaryColor || '#6366f1';
    const embedHeight = 700;

    if (!calendarUrl) {
        return (
            <div className="text-center py-10 space-y-3">
                <div
                    className="w-14 h-14 mx-auto flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}22`, borderRadius: 999 }}
                >
                    <Calendar size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                    <p className="font-bold" style={{ color: theme.textColor }}>{title}</p>
                    <p className="text-sm font-semibold opacity-40" style={{ color: theme.textColor }}>
                        Add a Calendly / Cal.com URL
                    </p>
                </div>
            </div>
        );
    }

    // If showInline — embed the calendar, otherwise show a button
    if (!showInline) {
        return (
            <div className="w-full py-4 space-y-3 text-center">
                <div className="flex items-center justify-center gap-3">
                    <div
                        className="w-10 h-10 flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}22`, borderRadius: 999 }}
                    >
                        <Calendar size={18} style={{ color: primaryColor }} />
                    </div>
                    <h3 className="text-lg font-black" style={{ color: theme.textColor }}>{title}</h3>
                </div>
                {description && (
                    <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{description}</p>
                )}
                <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-7 py-3.5 font-bold text-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: primaryColor, borderRadius, color: '#fff' }}
                >
                    <Calendar size={16} />
                    {buttonText}
                </a>
            </div>
        );
    }

    // Inline embed
    const src = calendarUrl.includes('calendly.com')
        ? `${calendarUrl.replace(/\/$/, '')}?embed_type=Inline&embed_domain=1`
        : calendarUrl;

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}22`, borderRadius: 999 }}
                >
                    <Calendar size={18} style={{ color: primaryColor }} />
                </div>
                <div>
                    <h3 className="text-lg font-black" style={{ color: theme.textColor }}>{title}</h3>
                    {description && <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{description}</p>}
                </div>
            </div>
            <div className="w-full overflow-hidden" style={{ borderRadius, height: embedHeight }}>
                <iframe
                    src={src}
                    width="100%"
                    height={embedHeight}
                    style={{ border: 'none' }}
                    title={title}
                    loading="lazy"
                />
            </div>
        </div>
    );
}
