'use client';

import React from 'react';
import NextImage from 'next/image';
import { MapPin, Link as LinkIcon, Calendar, CheckCircle, Award } from 'lucide-react';

interface CreatorBioProps {
    creator: {
        displayName: string;
        username: string;
        bio?: string;
        avatar?: string;
        location?: string;
        website?: string;
        joinedDate?: string;
        verified?: boolean;
        badges?: string[];
        theme?: any;
    };
}

export default function CreatorBio({ creator }: CreatorBioProps) {
    const theme = creator.theme || {
        primaryColor: '#6366f1',
        backgroundColor: '#ffffff',
        textColor: '#1f2937'
    };

    return (
        <div
            className="rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all duration-500 backdrop-blur-sm relative sm:sticky sm:top-24"
            style={{
                backgroundColor: `${theme.backgroundColor}CC`, // Add some transparency
                color: theme.textColor,
                borderColor: `${theme.primaryColor}20`
            }}
        >
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden mx-auto shadow-xl shadow-purple-100 relative">
                    {creator.avatar ? (
                        <NextImage
                            src={creator.avatar}
                            alt={creator.displayName}
                            fill
                            sizes="96px"
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-3xl font-bold text-purple-300">
                            {creator.displayName.charAt(0)}
                        </div>
                    )}
                </div>
                {creator.verified && (
                    <div className="absolute bottom-0 right-1/2 translate-x-12 translate-y-2 bg-white p-1 rounded-full shadow-sm">
                        <CheckCircle className="w-5 h-5 text-blue-500 fill-white" />
                    </div>
                )}
            </div>

            <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: theme.textColor }}>{creator.displayName}</h1>
                <p className="text-xs sm:text-sm font-medium opacity-60" style={{ color: theme.textColor }}>@{creator.username}</p>
            </div>

            <p className="leading-relaxed text-center text-xs sm:text-sm mb-6 sm:mb-8 opacity-80" style={{ color: theme.textColor }}>
                {creator.bio || "Digital creator sharing knowledge and assets."}
            </p>

            <div className="space-y-4 border-t pt-6" style={{ borderColor: `${theme.primaryColor}20` }}>
                {creator.location && (
                    <div className="flex items-center gap-3 text-sm opacity-70" style={{ color: theme.textColor }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
                            <MapPin className="w-4 h-4" />
                        </div>
                        {creator.location}
                    </div>
                )}
                {creator.website && (
                    <div className="flex items-center gap-3 text-sm opacity-70" style={{ color: theme.textColor }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
                            <LinkIcon className="w-4 h-4" />
                        </div>
                        <a href={creator.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" style={{ color: theme.primaryColor }}>
                            {creator.website.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                )}
                <div className="flex items-center gap-3 text-sm opacity-70" style={{ color: theme.textColor }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
                        <Calendar className="w-4 h-4" />
                    </div>
                    Joined {creator.joinedDate || '2024'}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t" style={{ borderColor: `${theme.primaryColor}20` }}>
                <button
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                    style={{
                        backgroundColor: theme.primaryColor,
                        color: '#ffffff', // Usually white text on primary buttons
                        boxShadow: `0 10px 15px -3px ${theme.primaryColor}30`
                    }}
                >
                    Subscribe for Updates
                </button>
            </div>
        </div>
    );
}
