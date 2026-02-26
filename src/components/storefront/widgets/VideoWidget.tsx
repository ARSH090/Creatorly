'use client';

import React from 'react';
import type { VideoSettings } from '@/types/storefront-blocks.types';

interface VideoWidgetProps {
    settings: VideoSettings;
    theme: Record<string, string>;
}

const ASPECT_CLASSES: Record<string, string> = {
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16] max-w-xs mx-auto',
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
};

function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

export default function VideoWidget({ settings, theme }: VideoWidgetProps) {
    const { url, type, thumbnail, autoplay, muted, aspectRatio = '16:9', showBranding = false, title } = settings;
    const borderRadius = Number(theme.borderRadius || 12);

    if (!url) {
        return (
            <div className={`${ASPECT_CLASSES[aspectRatio]} flex items-center justify-center rounded-2xl`}
                style={{ backgroundColor: theme.cardColor || 'rgba(255,255,255,0.04)', borderRadius }}>
                <div className="text-center opacity-30">
                    <p className="text-4xl mb-2">🎬</p>
                    <p className="text-sm font-semibold" style={{ color: theme.textColor }}>Add a video URL</p>
                </div>
            </div>
        );
    }

    const aspectClass = ASPECT_CLASSES[aspectRatio] || 'aspect-video';

    // YouTube
    if ((type === 'youtube' || url.includes('youtube') || url.includes('youtu.be'))) {
        const ytId = getYouTubeId(url);
        if (ytId) {
            const params = new URLSearchParams({
                autoplay: autoplay ? '1' : '0',
                mute: (muted || autoplay) ? '1' : '0',
                controls: showBranding ? '1' : '0',
                modestbranding: showBranding ? '0' : '1',
                rel: '0',
            });
            return (
                <div className="w-full">
                    {title && <h3 className="text-lg font-bold mb-3" style={{ color: theme.textColor }}>{title}</h3>}
                    <div className={`${aspectClass} overflow-hidden`} style={{ borderRadius }}>
                        <iframe
                            src={`https://www.youtube.com/embed/${ytId}?${params}`}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={title || 'Video'}
                        />
                    </div>
                </div>
            );
        }
    }

    // Vimeo
    if ((type === 'vimeo' || url.includes('vimeo.com'))) {
        const vimeoId = getVimeoId(url);
        if (vimeoId) {
            return (
                <div className="w-full">
                    {title && <h3 className="text-lg font-bold mb-3" style={{ color: theme.textColor }}>{title}</h3>}
                    <div className={`${aspectClass} overflow-hidden`} style={{ borderRadius }}>
                        <iframe
                            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}`}
                            className="w-full h-full"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            title={title || 'Video'}
                        />
                    </div>
                </div>
            );
        }
    }

    // Direct MP4
    if (type === 'mp4' || url.endsWith('.mp4') || url.includes('.mp4')) {
        return (
            <div className="w-full">
                {title && <h3 className="text-lg font-bold mb-3" style={{ color: theme.textColor }}>{title}</h3>}
                <div className={`${aspectClass} overflow-hidden`} style={{ borderRadius }}>
                    <video
                        src={url}
                        poster={thumbnail}
                        className="w-full h-full object-cover"
                        controls={!autoplay}
                        autoPlay={autoplay}
                        muted={muted || autoplay}
                        loop={autoplay}
                        playsInline
                    />
                </div>
            </div>
        );
    }

    // Instagram reels / fallback iframe
    return (
        <div className="w-full">
            {title && <h3 className="text-lg font-bold mb-3" style={{ color: theme.textColor }}>{title}</h3>}
            <div className={`${aspectClass} overflow-hidden`} style={{ borderRadius }}>
                <iframe src={url} className="w-full h-full" allowFullScreen title={title || 'Video'} />
            </div>
        </div>
    );
}
