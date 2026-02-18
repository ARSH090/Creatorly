'use client';

import React from 'react';
import { ExternalLink, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Link {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    description?: string;
    isActive: boolean;
}

interface LinksSectionProps {
    links: Link[];
    theme: {
        primaryColor: string;
        backgroundColor: string;
        textColor: string;
        fontFamily: string;
        borderRadius: string;
        buttonStyle: 'pill' | 'square' | 'rounded';
    };
    creatorId: string;
}

export default function LinksSection({ links, theme, creatorId }: LinksSectionProps) {
    const activeLinks = links?.filter(link => link.isActive) || [];

    if (activeLinks.length === 0) return null;

    const handleLinkClick = async (linkId: string, url: string) => {
        try {
            // Fire and forget click tracking
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'link_click',
                    creatorId,
                    metadata: { linkId, url }
                })
            }).catch(console.error);
        } catch (e) {
            // Ignore errors
        }
    };

    const getBorderRadius = () => {
        switch (theme.borderRadius) {
            case 'sm': return 'rounded-sm';
            case 'md': return 'rounded-md';
            case 'lg': return 'rounded-xl';
            case 'full': return 'rounded-full';
            default: return 'rounded-2xl';
        }
    };

    return (
        <section className="space-y-4 w-full max-w-2xl mx-auto">
            {activeLinks.map((link, index) => (
                <motion.a
                    key={link.id || index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick(link.id, link.url)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group relative flex items-center p-4 w-full transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 ${getBorderRadius()}`}
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {link.thumbnail && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden mr-4 flex-shrink-0 bg-white/5 border border-white/5">
                            <img src={link.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-base">{link.title}</h3>
                        {link.description && (
                            <p className="text-xs opacity-60 line-clamp-1">{link.description}</p>
                        )}
                    </div>

                    <div className="ml-4 opacity-40 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5" />
                    </div>

                    {/* Hover Glow Effect */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                            boxShadow: `0 0 20px ${theme.primaryColor}20`,
                            borderRadius: 'inherit'
                        }}
                    />
                </motion.a>
            ))}
        </section>
    );
}
