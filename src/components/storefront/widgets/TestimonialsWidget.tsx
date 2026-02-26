'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { TestimonialsSettings } from '@/types/storefront-blocks.types';

interface TestimonialsWidgetProps {
    settings: TestimonialsSettings;
    theme: Record<string, string>;
}

function StarRating({ rating = 5, color }: { rating: number; color: string }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    size={14}
                    className={i <= rating ? 'fill-current' : 'opacity-20'}
                    style={{ color }}
                />
            ))}
        </div>
    );
}

function TestimonialCard({ t, theme, borderRadius }: { t: any; theme: Record<string, string>; borderRadius: number }) {
    return (
        <div
            className="p-5 flex flex-col gap-4"
            style={{
                backgroundColor: theme.cardColor || 'rgba(255,255,255,0.04)',
                borderRadius,
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {t.rating && <StarRating rating={t.rating} color={theme.accentColor || '#f59e0b'} />}
            <p className="text-sm leading-relaxed opacity-80" style={{ color: theme.textColor || '#fff' }}>
                &ldquo;{t.content}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-auto">
                {t.avatar ? (
                    <Image src={t.avatar} alt={t.name} width={36} height={36} className="rounded-full object-cover" />
                ) : (
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: theme.primaryColor || '#6366f1', color: '#fff' }}
                    >
                        {t.name?.[0] || '?'}
                    </div>
                )}
                <div>
                    <p className="font-bold text-sm" style={{ color: theme.textColor || '#fff' }}>{t.name}</p>
                    {t.role && <p className="text-xs opacity-50" style={{ color: theme.textColor }}>{t.role}</p>}
                </div>
                {t.source && (
                    <span className="ml-auto text-[10px] uppercase font-black tracking-widest opacity-40" style={{ color: theme.textColor }}>
                        {t.source}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function TestimonialsWidget({ settings, theme }: TestimonialsWidgetProps) {
    const { items = [], displayMode = 'grid', title = 'What People Say' } = settings;
    const [carouselIdx, setCarouselIdx] = useState(0);
    const borderRadius = Number(theme.borderRadius || 12);

    if (!items.length) return null;

    return (
        <section className="w-full py-4">
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: theme.textColor || '#fff' }}>
                    {title}
                </h2>
                <div className="h-px flex-1 opacity-10" style={{ backgroundColor: theme.textColor || '#fff' }} />
            </div>

            {/* Grid */}
            {displayMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map(t => (
                        <TestimonialCard key={t.id} t={t} theme={theme} borderRadius={borderRadius} />
                    ))}
                </div>
            )}

            {/* Masonry */}
            {displayMode === 'masonry' && (
                <div className="columns-1 sm:columns-2 gap-4">
                    {items.map(t => (
                        <div key={t.id} className="break-inside-avoid mb-4">
                            <TestimonialCard t={t} theme={theme} borderRadius={borderRadius} />
                        </div>
                    ))}
                </div>
            )}

            {/* Wall */}
            {displayMode === 'wall' && (
                <div className="flex flex-wrap gap-3">
                    {items.map(t => (
                        <div key={t.id} className="flex-1 min-w-[240px]">
                            <TestimonialCard t={t} theme={theme} borderRadius={borderRadius} />
                        </div>
                    ))}
                </div>
            )}

            {/* Carousel */}
            {displayMode === 'carousel' && (
                <div className="relative">
                    <div className="overflow-hidden" style={{ borderRadius }}>
                        <div
                            className="flex transition-transform duration-300"
                            style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
                        >
                            {items.map(t => (
                                <div key={t.id} className="w-full flex-shrink-0">
                                    <TestimonialCard t={t} theme={theme} borderRadius={borderRadius} />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-4">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCarouselIdx(i)}
                                className="w-2 h-2 rounded-full transition-all"
                                style={{
                                    backgroundColor: i === carouselIdx ? (theme.primaryColor || '#6366f1') : 'rgba(255,255,255,0.2)',
                                    width: i === carouselIdx ? 24 : 8,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
