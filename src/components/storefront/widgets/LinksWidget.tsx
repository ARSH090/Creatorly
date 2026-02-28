'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import type { LinksSettings } from '@/types/storefront-blocks.types';

interface LinksWidgetProps {
    settings: LinksSettings;
    theme: Record<string, string>;
}

const NOW = () => new Date();

const isScheduleActive = (start?: string, end?: string): boolean => {
    const now = NOW();
    if (start && new Date(start) > now) return false;
    if (end && new Date(end) < now) return false;
    return true;
};

const BUTTON_STYLE_CLASSES: Record<string, string> = {
    filled: 'text-white font-bold',
    outline: 'bg-transparent border-2 font-bold',
    ghost: 'bg-white/10 backdrop-blur font-bold',
    pill: 'text-white font-bold',
    neon: 'text-white font-bold border shadow-neon',
    glass: 'backdrop-blur-lg border font-bold',
};

export default function LinksWidget({ settings, theme }: LinksWidgetProps) {
    const {
        buttons = [],
        buttonStyle = 'filled',
        showThumbnails = true,
        showClickCount = false,
    } = settings;

    const activeButtons = buttons
        .filter(b => b.isActive && isScheduleActive(b.scheduleStart, b.scheduleEnd))
        .sort((a, b) => a.order - b.order);

    const borderRadius = Number(theme.borderRadius || 12);

    const getButtonStyle = (): React.CSSProperties => {
        switch (buttonStyle) {
            case 'filled':
                return { backgroundColor: theme.primaryColor || '#6366f1', borderRadius };
            case 'outline':
                return { borderColor: theme.primaryColor || '#6366f1', borderRadius, color: theme.primaryColor || '#6366f1' };
            case 'ghost':
                return { borderRadius };
            case 'pill':
                return { backgroundColor: theme.primaryColor || '#6366f1', borderRadius: 999 };
            case 'neon':
                return {
                    backgroundColor: `${theme.primaryColor || '#6366f1'}22`,
                    borderColor: theme.primaryColor || '#6366f1',
                    borderRadius,
                    boxShadow: `0 0 20px ${theme.primaryColor || '#6366f1'}44`,
                };
            case 'glass':
                return {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius,
                    backdropFilter: 'blur(12px)',
                };
            default:
                return { backgroundColor: theme.primaryColor || '#6366f1', borderRadius };
        }
    };

    return (
        <div className="w-full flex flex-col gap-4 py-2">
            {activeButtons.map((btn) => (
                <a
                    key={btn.id}
                    href={btn.url}
                    target={btn.url?.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className={`relative flex items-center gap-4 w-full px-5 py-4 transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] group ${BUTTON_STYLE_CLASSES[buttonStyle]}`}
                    style={{ ...getButtonStyle(), color: buttonStyle === 'outline' ? theme.primaryColor : (theme.textColor || '#fff') }}
                >
                    {/* Badge */}
                    {btn.badgeText && (
                        <span
                            className="absolute -top-2 left-4 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white z-10"
                            style={{ backgroundColor: btn.badgeColor || '#ef4444' }}
                        >
                            {btn.badgeText}
                        </span>
                    )}

                    {/* Thumbnail */}
                    {showThumbnails && btn.thumbnail && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                            <Image
                                src={btn.thumbnail}
                                alt={btn.title}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-base truncate">{btn.title}</p>
                        {btn.description && (
                            <p className="text-xs opacity-70 truncate mt-0.5">{btn.description}</p>
                        )}
                        {showClickCount && btn.clickCount !== undefined && (
                            <p className="text-[10px] opacity-40 mt-0.5">{btn.clickCount} clicks</p>
                        )}
                    </div>

                    {/* Arrow */}
                    <ExternalLink size={16} className="opacity-50 flex-shrink-0 group-hover:opacity-100 transition-opacity" />
                </a>
            ))}

            {activeButtons.length === 0 && (
                <div className="text-center py-8 opacity-30">
                    <p className="text-sm font-semibold">No active links</p>
                </div>
            )}
        </div>
    );
}
