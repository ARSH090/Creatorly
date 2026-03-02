'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter as TwitterIcon, Share2 } from 'lucide-react';
import type { SocialFeedSettings } from '@/types/storefront-blocks.types';

interface Props {
    settings: SocialFeedSettings;
    theme: Record<string, string>;
}

export default function SocialFeedWidget({ settings, theme }: Props) {
    // Mock feed data
    const posts = Array.from({ length: settings.limit || 6 }).map((_, i) => ({
        id: i.toString(),
        type: 'image',
        url: `https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?q=80&w=400&auto=format&fit=crop`,
        likes: '1.2K',
        comments: '48',
    }));

    const isInstagram = settings.platform === 'instagram';
    const isTwitter = settings.platform === 'twitter';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/10">
                        {isInstagram && <Instagram size={20} className="text-pink-500" />}
                        {isTwitter && <TwitterIcon size={20} className="text-sky-400" />}
                        {!isInstagram && !isTwitter && <Share2 size={20} className="text-zinc-500" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: theme.textColor }}>
                            {settings.username ? `@${settings.username.replace('@', '')}` : 'Recent Posts'}
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">{settings.platform || 'Social Feed'}</p>
                    </div>
                </div>

                <button
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
                    style={{ color: theme.textColor }}
                >
                    Follow
                </button>
            </div>

            <div className={`grid gap-4 ${settings.layout === 'carousel' ? 'flex overflow-x-auto pb-4 scrollbar-hide' : 'grid-cols-2 md:grid-cols-3'}`}>
                {posts.map((post, idx) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        viewport={{ once: true }}
                        className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-zinc-900"
                    >
                        <img
                            src={post.url}
                            alt="Social post"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <div className="flex gap-4">
                                <span className="text-white text-xs font-bold flex items-center gap-1">❤️ {post.likes}</span>
                                <span className="text-white text-xs font-bold flex items-center gap-1">💬 {post.comments}</span>
                            </div>
                            {isInstagram && <Instagram size={16} className="text-white/40" />}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
