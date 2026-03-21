'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter as TwitterIcon, Share2, Youtube, Music, Linkedin, Pin, Mail } from 'lucide-react';
import type { SocialFeedSettings } from '@/types/storefront-blocks.types';
import { sanitizeHtml } from '@/lib/utils/sanitizer';

interface Props {
    settings: SocialFeedSettings;
    theme: Record<string, string>;
}

export default function SocialFeedWidget({ settings, theme }: Props) {
    const {
        platform = 'instagram',
        urls = [],
        layout = 'grid',
        columns = 3,
        title,
        showFollowButton = true,
        followButtonText = 'Follow',
        followUrl = '#',
        borderRadius = '16',
        gap = 'md',
        aspectRatio = '1/1'
    } = settings;

    const [embedData, setEmbedData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEmbeds = async () => {
            if (!urls.length) return;
            setLoading(true);
            const newData: Record<string, any> = {};

            const fetchPromises = urls.map(async (url) => {
                if (['instagram', 'twitter', 'tiktok'].includes(platform)) {
                    try {
                        const res = await fetch(`/api/storefront/oembed?platform=${platform}&url=${encodeURIComponent(url)}`);
                        const data = await res.json();
                        newData[url] = data;
                    } catch (e) {
                        console.error('Failed to fetch embed for', url);
                    }
                }
            });

            await Promise.all(fetchPromises);
            setEmbedData(newData);
            setLoading(false);
        };

        fetchEmbeds();
    }, [platform, urls]);

    const getYouTubeId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
            /(?:youtu\.be\/)([^\s?]+)/,
            /(?:youtube\.com\/embed\/)([^\s?]+)/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const getSpotifyEmbedUrl = (url: string): string => {
        return url
            .replace('open.spotify.com/', 'open.spotify.com/embed/')
            .replace('spotify.com/track/', 'spotify.com/embed/track/')
            .replace('spotify.com/playlist/', 'spotify.com/embed/playlist/')
            .replace('spotify.com/album/', 'spotify.com/embed/album/');
    };

    const renderEmbed = (url: string) => {
        if (platform === 'youtube') {
            const id = getYouTubeId(url);
            if (!id) return <div className="p-4 bg-zinc-900 text-xs italic opacity-40">Invalid YouTube URL</div>;
            return (
                <iframe
                    src={`https://www.youtube.com/embed/${id}`}
                    className="w-full h-full rounded-xl"
                    allowFullScreen
                    title="YouTube video"
                />
            );
        }

        if (platform === 'spotify') {
            return (
                <iframe
                    src={getSpotifyEmbedUrl(url)}
                    className="w-full h-full rounded-xl"
                    frameBorder="0"
                    allow="encrypted-media"
                    title="Spotify player"
                />
            );
        }

        if (platform === 'linkedin') {
            const linkedinUrl = url.includes('embed') ? url : url.replace('/posts/', '/embed/posts/');
            return (
                <iframe
                    src={linkedinUrl}
                    className="w-full h-full rounded-xl"
                    title="LinkedIn Post"
                />
            );
        }

        const data = embedData[url];
        if (data?.html) {
            return (
                <div
                    className="w-full h-full overflow-hidden flex items-center justify-center p-2"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.html || '') }}
                />
            );
        }

        if (loading) {
            return <div className="w-full h-full bg-zinc-900 border border-white/5 animate-pulse rounded-xl" />;
        }

        return (
            <div className="w-full h-full bg-zinc-900 border border-white/5 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <Share2 size={24} className="opacity-20" />
                <span className="text-[10px] font-bold opacity-30 break-all">{url}</span>
            </div>
        );
    };

    const getPlatformIcon = () => {
        switch (platform) {
            case 'instagram': return <Instagram size={20} className="text-pink-500" />;
            case 'youtube': return <Youtube size={20} className="text-red-600" />;
            case 'spotify': return <Music size={20} className="text-green-500" />;
            case 'twitter': return <TwitterIcon size={20} className="text-sky-400" />;
            case 'linkedin': return <Linkedin size={20} className="text-blue-600" />;
            case 'pinterest': return <Pin size={20} className="text-red-500" />;
            default: return <Share2 size={20} className="text-zinc-500" />;
        }
    };

    const gapSize = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' }[gap];
    const gridCols = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }[columns as 1 | 2 | 3];

    return (
        <div className="space-y-6">
            {(title || showFollowButton) && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/10">
                            {getPlatformIcon()}
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: theme.textColor }}>
                                {title || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Feed`}
                            </h3>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">{platform}</p>
                        </div>
                    </div>

                    {showFollowButton && (
                        <a
                            href={followUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
                            style={{ color: theme.textColor }}
                        >
                            {followButtonText}
                        </a>
                    )}
                </div>
            )}

            <div className={`grid ${gapSize} ${layout === 'carousel' ? 'flex overflow-x-auto pb-4 scrollbar-hide snap-x' : gridCols}`}>
                {(urls.length > 0 ? urls : [1, 2, 3]).map((url, idx) => (
                    <motion.div
                        key={typeof url === 'string' ? url : idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        viewport={{ once: true }}
                        className={`relative group overflow-hidden border border-white/5 bg-transparent snap-center`}
                        style={{
                            borderRadius: `${borderRadius}px`,
                            aspectRatio: layout === 'carousel' ? undefined : (aspectRatio === 'auto' ? undefined : aspectRatio),
                            width: layout === 'carousel' ? '300px' : 'auto',
                            minHeight: '200px'
                        }}
                    >
                        {typeof url === 'string' ? renderEmbed(url) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-dashed border-white/10 opacity-20">
                                <Share2 size={24} />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
