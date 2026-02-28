'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { GallerySettings } from '@/types/storefront-blocks.types';

interface GalleryWidgetProps {
    settings: GallerySettings;
    theme: Record<string, string>;
}

const ASPECT_CLASS: Record<string, string> = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
};

const COLS_CLASS: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
};

export default function GalleryWidget({ settings, theme }: GalleryWidgetProps) {
    const { images = [], displayMode = 'grid', aspectRatio = 'square', columns = 3, title } = settings;
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const [carouselIdx, setCarouselIdx] = useState(0);
    const borderRadius = Number(theme.borderRadius || 12);

    if (!images.length) {
        return (
            <div className="text-center py-10 opacity-30">
                <p className="text-4xl mb-2">🖼️</p>
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>No images yet</p>
            </div>
        );
    }

    const aspectClass = ASPECT_CLASS[aspectRatio] || ASPECT_CLASS.square;

    const openLightbox = (idx: number) => setLightboxIdx(idx);
    const closeLightbox = () => setLightboxIdx(null);
    const prev = () => setLightboxIdx(i => (i !== null ? (i - 1 + images.length) % images.length : 0));
    const next = () => setLightboxIdx(i => (i !== null ? (i + 1) % images.length : 0));

    return (
        <section className="w-full py-4">
            {title && (
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: theme.textColor || '#fff' }}>{title}</h2>
                    <div className="h-px flex-1 opacity-10" style={{ backgroundColor: theme.textColor || '#fff' }} />
                </div>
            )}

            {/* Grid / Lightbox */}
            {(displayMode === 'grid' || displayMode === 'lightbox') && (
                <div className={`grid ${COLS_CLASS[columns] || COLS_CLASS[3]} gap-2`}>
                    {images.map((img, idx) => (
                        <div
                            key={img.id}
                            className={`relative ${aspectClass} overflow-hidden cursor-pointer group`}
                            style={{ borderRadius }}
                            onClick={() => openLightbox(idx)}
                        >
                            <Image src={img.url} alt={img.caption || img.alt || ''} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {img.caption && (
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs text-white font-medium truncate">{img.caption}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Masonry */}
            {displayMode === 'masonry' && (
                <div className="columns-2 sm:columns-3 gap-2 space-y-2">
                    {images.map((img, idx) => (
                        <div
                            key={img.id}
                            className="break-inside-avoid mb-2 relative overflow-hidden cursor-pointer group"
                            style={{ borderRadius }}
                            onClick={() => openLightbox(idx)}
                        >
                            <Image src={img.url} alt={img.caption || ''} width={400} height={300} className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                    ))}
                </div>
            )}

            {/* Carousel */}
            {displayMode === 'carousel' && (
                <div className="relative">
                    <div className="overflow-hidden" style={{ borderRadius }}>
                        <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
                        >
                            {images.map(img => (
                                <div key={img.id} className={`w-full flex-shrink-0 relative ${aspectClass}`}>
                                    <Image src={img.url} alt={img.caption || ''} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => setCarouselIdx(i => (i - 1 + images.length) % images.length)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setCarouselIdx(i => (i + 1) % images.length)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <div className="flex justify-center gap-1.5 mt-3">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCarouselIdx(i)}
                                        className="h-1.5 rounded-full transition-all"
                                        style={{
                                            width: i === carouselIdx ? 24 : 8,
                                            backgroundColor: i === carouselIdx ? (theme.primaryColor || '#6366f1') : 'rgba(255,255,255,0.2)',
                                        }}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Lightbox */}
            {lightboxIdx !== null && (
                <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
                    <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition" onClick={closeLightbox}>
                        <X size={20} />
                    </button>
                    {images.length > 1 && (
                        <>
                            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition" onClick={e => { e.stopPropagation(); prev(); }}>
                                <ChevronLeft size={20} />
                            </button>
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition" onClick={e => { e.stopPropagation(); next(); }}>
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                    <div className="max-w-4xl max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
                        <Image
                            src={images[lightboxIdx].url}
                            alt={images[lightboxIdx].caption || ''}
                            width={1200}
                            height={900}
                            className="max-h-[80vh] w-auto object-contain"
                            style={{ borderRadius: 8 }}
                        />
                        {images[lightboxIdx].caption && (
                            <p className="text-center text-sm text-white/60 mt-3">{images[lightboxIdx].caption}</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
