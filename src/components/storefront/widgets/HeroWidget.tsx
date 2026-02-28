'use client';

import React from 'react';
import Image from 'next/image';
import { TypeAnimation } from 'react-type-animation';
import type { HeroSettings } from '@/types/storefront-blocks.types';

interface HeroWidgetProps {
    settings: HeroSettings;
    theme: Record<string, string>;
    creator?: { displayName?: string; username?: string; avatar?: string; bio?: string };
}

const PHOTO_SHAPES: Record<string, string> = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-3xl',
};

const CTA_STYLES: Record<string, string> = {
    filled: 'text-white',
    outline: 'bg-transparent border-2 text-white',
    ghost: 'bg-white/10 backdrop-blur text-white',
};

export default function HeroWidget({ settings, theme, creator }: HeroWidgetProps) {
    const displayName = settings.displayName || creator?.displayName || 'Creator';
    const bio = settings.bio || creator?.bio || '';
    const ctaText = settings.ctaText || '';
    const ctaUrl = settings.ctaUrl || '#';
    const ctaStyle = settings.ctaStyle || 'filled';
    const textAlign = settings.textAlign || 'center';
    const photoShape = settings.photoShape || 'circle';
    const typingWords = settings.typingWords?.length ? settings.typingWords : ['Creator', 'Coach', 'Developer'];
    const avatar = creator?.avatar || '';

    // Background style
    let bgStyle: React.CSSProperties = {};
    if (settings.bgType === 'gradient' && settings.bgValue) {
        bgStyle.background = settings.bgValue;
    } else if (settings.bgType === 'image' && settings.bgValue) {
        bgStyle.backgroundImage = `url(${settings.bgValue})`;
        bgStyle.backgroundSize = 'cover';
        bgStyle.backgroundPosition = 'center';
    } else if (settings.bgType === 'color' && settings.bgValue) {
        bgStyle.backgroundColor = settings.bgValue;
    }

    const alignClass = textAlign === 'left' ? 'text-left items-start' : textAlign === 'right' ? 'text-right items-end' : 'text-center items-center';

    return (
        <section
            className="relative w-full py-16 px-6 overflow-hidden"
            style={bgStyle}
        >
            {/* Cover banner */}
            {settings.coverImage && (
                <div className="absolute inset-0 z-0">
                    <Image src={settings.coverImage} alt="cover" fill className="object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />
                </div>
            )}
            {settings.coverGradient && !settings.coverImage && (
                <div className="absolute inset-0 z-0 opacity-40" style={{ background: settings.coverGradient }} />
            )}

            <div className={`relative z-10 flex flex-col ${alignClass} gap-5 max-w-2xl mx-auto`}>
                {/* Avatar */}
                {avatar && (
                    <div className="flex-shrink-0">
                        <div className={`w-28 h-28 overflow-hidden border-4 border-white/20 shadow-2xl ${PHOTO_SHAPES[photoShape]}`}>
                            <Image src={avatar} alt={displayName} width={112} height={112} className="object-cover w-full h-full" />
                        </div>
                    </div>
                )}

                {/* Name */}
                <div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: theme.textColor || '#fff' }}>
                        {displayName}
                    </h1>
                    {settings.showUsername && creator?.username && (
                        <p className="text-sm font-medium mt-1 opacity-60" style={{ color: theme.textColor || '#fff' }}>
                            @{creator.username}
                        </p>
                    )}
                </div>

                {/* Typing animation */}
                {typingWords.length > 0 && (
                    <p className="text-lg font-semibold" style={{ color: theme.primaryColor || '#6366f1' }}>
                        I am a{' '}
                        <TypeAnimation
                            sequence={typingWords.flatMap(w => [w, 2000])}
                            wrapper="span"
                            speed={50}
                            repeat={Infinity}
                        />
                    </p>
                )}

                {/* Bio */}
                {bio && (
                    <p
                        className="text-base leading-relaxed max-w-lg opacity-80"
                        style={{ color: theme.textColor || '#fff' }}
                    >
                        {bio}
                    </p>
                )}

                {/* CTA Button */}
                {ctaText && (
                    <a
                        href={ctaUrl}
                        target={ctaUrl.startsWith('http') ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-7 py-3.5 font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-lg ${CTA_STYLES[ctaStyle]}`}
                        style={{
                            backgroundColor: ctaStyle === 'filled' ? (theme.primaryColor || '#6366f1') : undefined,
                            borderColor: ctaStyle === 'outline' ? (theme.primaryColor || '#6366f1') : undefined,
                            borderRadius: Number(theme.borderRadius || 12),
                        }}
                    >
                        {ctaText}
                    </a>
                )}
            </div>
        </section>
    );
}
