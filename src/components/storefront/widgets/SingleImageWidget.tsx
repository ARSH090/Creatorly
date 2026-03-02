'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { ImageBlockSettings } from '@/types/storefront-blocks.types';

interface Props {
    settings: ImageBlockSettings;
    theme: Record<string, string>;
}

export default function SingleImageWidget({ settings, theme }: Props) {
    if (!settings.url) {
        return (
            <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-20" style={{ borderColor: theme.textColor + '22' }}>
                <p className="text-sm font-bold">Upload an image</p>
            </div>
        );
    }

    const aspectRatios = {
        'auto': '',
        'square': 'aspect-square',
        '16:9': 'aspect-video',
        '4:3': 'aspect-[4/3]',
    };

    const Container = settings.link ? 'a' : 'div';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full h-full overflow-hidden"
            style={{
                borderRadius: `${settings.borderRadius ?? Number(theme.borderRadius)}px`
            }}
        >
            <Container
                href={settings.link}
                target={settings.link ? "_blank" : undefined}
                rel={settings.link ? "noopener noreferrer" : undefined}
                className={`relative block w-full group ${aspectRatios[settings.aspectRatio || 'auto']}`}
            >
                <img
                    src={settings.url}
                    alt={settings.alt || 'Storefront image'}
                    className={`w-full h-full object-cover transition-transform duration-700 ${settings.link ? 'group-hover:scale-105' : ''}`}
                    style={{
                        maxHeight: settings.aspectRatio === 'auto' ? '800px' : 'none'
                    }}
                />

                {settings.caption && (
                    <div className="p-3 text-center">
                        <p className="text-xs font-medium opacity-60 italic">{settings.caption}</p>
                    </div>
                )}

                {settings.link && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-xs font-bold">
                            View Link
                        </div>
                    </div>
                )}
            </Container>
        </motion.div>
    );
}
