'use client';

import React from 'react';
import NextImage from 'next/image';
import {
    ExternalLink, Globe, MessageCircle, Mail, Camera, Play,
    Calendar, Send, Twitter, Linkedin, Music2, Star, Tag,
    Zap, Clock, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Icon registry ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    ExternalLink, Globe, MessageCircle, Mail, Camera, Play,
    Calendar, Send, Twitter, Linkedin, Music2, Star, Tag, Zap, Clock,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoreLink {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    description?: string;
    isActive: boolean;
    order?: number;
    iconName?: string;
    badgeText?: string;
    badgeColor?: string;
    highlightBorder?: boolean;
    linkType?: string;
}

interface LinksSectionProps {
    links: StoreLink[];
    theme: {
        primaryColor: string;
        backgroundColor: string;
        textColor: string;
        fontFamily?: string;
        borderRadius?: string;
        buttonStyle?: 'pill' | 'square' | 'rounded';
    };
    creatorId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBorderRadius(style?: string): string {
    switch (style) {
        case 'pill': return '9999px';
        case 'square': return '10px';
        case 'rounded': return '16px';
        default: return '16px';
    }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LinksSection({ links, theme, creatorId }: LinksSectionProps) {
    const activeLinks = links?.filter(l => l.isActive) ?? [];

    if (activeLinks.length === 0) return null;

    const trackClick = (linkId: string, url: string) => {
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType: 'link_click',
                creatorId,
                metadata: { linkId, url },
            }),
        }).catch(() => null);
    };

    const br = getBorderRadius(theme.buttonStyle);

    return (
        <section aria-label="Links" className="space-y-3 w-full max-w-2xl mx-auto">
            {activeLinks.map((link, index) => {
                const IconComp = ICON_MAP[link.iconName ?? ''] ?? ExternalLink;
                const accentColor = link.badgeColor || theme.primaryColor;

                return (
                    <motion.a
                        key={link.id ?? index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackClick(link.id, link.url)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                        className="group relative flex items-center gap-3.5 px-4 py-3.5 w-full border transition-all hover:scale-[1.015] active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: br,
                            borderColor: link.highlightBorder
                                ? accentColor
                                : 'rgba(255,255,255,0.08)',
                            boxShadow: link.highlightBorder
                                ? `0 0 18px ${accentColor}35, 0 0 1px ${accentColor}`
                                : undefined,
                        }}
                        aria-label={link.title}
                    >
                        {/* Icon or thumbnail */}
                        <div
                            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: accentColor + '18' }}
                        >
                            {link.thumbnail ? (
                                <div className="relative w-full h-full">
                                    <NextImage
                                        src={link.thumbnail}
                                        alt=""
                                        className="object-cover"
                                        fill
                                        sizes="44px"
                                    />
                                </div>
                            ) : (
                                <IconComp className="w-5 h-5" style={{ color: accentColor }} aria-hidden="true" />
                            )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 text-left min-w-0">
                            <p className="font-bold text-sm sm:text-base leading-tight truncate">{link.title}</p>
                            {link.description && (
                                <p className="text-[11px] sm:text-xs opacity-50 line-clamp-1 mt-0.5">{link.description}</p>
                            )}
                        </div>

                        {/* Badge */}
                        {link.badgeText && (
                            <span
                                className="flex-shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: accentColor, color: '#fff' }}
                            >
                                {link.badgeText}
                            </span>
                        )}

                        {/* Chevron */}
                        <ChevronRight
                            className="w-4 h-4 flex-shrink-0 opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all"
                            aria-hidden="true"
                        />

                        {/* Hover glow */}
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{
                                boxShadow: `inset 0 0 0 1px ${accentColor}20, 0 8px 32px ${accentColor}15`,
                                borderRadius: 'inherit',
                            }}
                        />
                    </motion.a>
                );
            })}
        </section>
    );
}
