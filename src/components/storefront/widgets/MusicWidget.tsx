'use client';

import React from 'react';
import type { MusicSettings } from '@/types/storefront-blocks.types';
import { Music } from 'lucide-react';

interface MusicWidgetProps {
    settings: MusicSettings;
    theme: Record<string, string>;
}

function getSpotifyEmbed(url: string): string | null {
    const match = url.match(/spotify\.com\/(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/);
    return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
}

function getSoundCloudEmbed(url: string): string {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%236366f1&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
}

function getAppleMusicEmbed(url: string): string | null {
    const match = url.match(/music\.apple\.com\/([a-z]+)\/(album|playlist)\/([^\/]+)\/([0-9]+)/);
    return match ? `https://embed.music.apple.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}` : null;
}

function TrackPlayer({ track, theme }: { track: any; theme: Record<string, string> }) {
    const { embedUrl, audioUrl, platform, title: trackTitle, artist } = track;
    const borderRadius = Number(theme.borderRadius || 12);

    // Use embedUrl if provided directly
    const src = embedUrl;
    let computedSrc = src;
    let height = 80;

    if (!src && audioUrl) {
        if (platform === 'spotify' || audioUrl.includes('spotify')) {
            computedSrc = getSpotifyEmbed(audioUrl);
            height = 80;
        } else if (platform === 'apple' || audioUrl.includes('music.apple')) {
            computedSrc = getAppleMusicEmbed(audioUrl) || undefined;
            height = 150;
        } else if (platform === 'soundcloud' || audioUrl.includes('soundcloud')) {
            computedSrc = getSoundCloudEmbed(audioUrl);
            height = 120;
        } else if (platform === 'mp3' || audioUrl.endsWith('.mp3')) {
            return (
                <div className="space-y-1" style={{ borderRadius }}>
                    {(trackTitle || artist) && (
                        <p className="text-sm font-bold" style={{ color: theme.textColor }}>
                            {trackTitle}{artist && ` — ${artist}`}
                        </p>
                    )}
                    <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mpeg" />
                    </audio>
                </div>
            );
        }
    }

    if (!computedSrc) return null;

    return (
        <iframe
            src={computedSrc}
            width="100%"
            height={height}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius, border: 'none' }}
            title={trackTitle || 'Music Player'}
        />
    );
}

export default function MusicWidget({ settings, theme }: MusicWidgetProps) {
    const { tracks = [], title, showPlayer = true } = settings;
    const primaryColor = theme.primaryColor || '#6366f1';
    const borderRadius = Number(theme.borderRadius || 12);

    if (!tracks.length) {
        return (
            <div className="text-center py-10 opacity-30">
                <Music size={32} className="mx-auto mb-2 opacity-40" style={{ color: theme.textColor }} />
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>Add music tracks</p>
            </div>
        );
    }

    return (
        <div className="w-full py-2 space-y-4">
            {title && (
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: `${primaryColor}22` }}
                    >
                        <Music size={16} style={{ color: primaryColor }} />
                    </div>
                    <h3 className="font-black text-base" style={{ color: theme.textColor }}>{title}</h3>
                </div>
            )}
            {showPlayer && tracks.map(track => (
                <TrackPlayer key={track.id} track={track} theme={theme} />
            ))}
        </div>
    );
}
