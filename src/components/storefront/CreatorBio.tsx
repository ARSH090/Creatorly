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
    };
}

export default function CreatorBio({ creator }: CreatorBioProps) {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-24">
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden mx-auto shadow-xl shadow-purple-100 relative">
                    {creator.avatar ? (
                        <NextImage
                            src={creator.avatar}
                            alt={creator.displayName}
                            fill
                            sizes="96px"
                            className="object-cover"
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

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{creator.displayName}</h1>
                <p className="text-gray-500 font-medium">@{creator.username}</p>
            </div>

            <p className="text-gray-600 leading-relaxed text-center text-sm mb-8">
                {creator.bio || "Digital creator sharing knowledge and assets."}
            </p>

            <div className="space-y-4 border-t border-gray-100 pt-6">
                {creator.location && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-gray-400" />
                        </div>
                        {creator.location}
                    </div>
                )}
                {creator.website && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                            <LinkIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <a href={creator.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline truncate">
                            {creator.website.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    Joined {creator.joinedDate || '2024'}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                    Subscribe for Updates
                </button>
            </div>
        </div>
    );
}
