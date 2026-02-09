'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react';

interface ProductGalleryProps {
    mainImage: string;
    files?: Array<{ name: string, url: string, mimeType?: string }>;
}

export default function ProductGallery({ mainImage, files = [] }: ProductGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const media = [
        { url: mainImage, type: 'image' },
        ...files.filter(f => f.mimeType?.startsWith('image/') || f.mimeType?.startsWith('video/'))
            .map(f => ({ url: f.url, type: f.mimeType?.startsWith('video/') ? 'video' : 'image' }))
    ];

    const next = () => setActiveIndex((prev) => (prev + 1) % media.length);
    const prev = () => setActiveIndex((prev) => (prev - 1 + media.length) % media.length);

    return (
        <div className="space-y-4">
            {/* Main Display */}
            <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 group cursor-crosshair">
                {media[activeIndex].type === 'video' ? (
                    <video
                        src={media[activeIndex].url}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        muted
                        loop
                    />
                ) : (
                    <Image
                        src={media[activeIndex].url}
                        alt="Product Preview"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        priority
                    />
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {media.length > 1 && (
                    <>
                        <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500">
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                <button className="absolute bottom-4 right-4 p-2 rounded-xl bg-white/10 backdrop-blur-md text-white/50 hover:text-white transition-colors">
                    <Maximize2 size={16} />
                </button>
            </div>

            {/* Thumbnails */}
            {media.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {media.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${activeIndex === idx ? 'border-indigo-500 scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                                }`}
                        >
                            <Image src={item.url} alt="Thumb" fill className="object-cover" />
                            {item.type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Play size={20} className="text-white fill-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
