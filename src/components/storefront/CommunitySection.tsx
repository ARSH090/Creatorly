'use client';

import React from 'react';
import { MessageSquare, Heart, Share2 } from 'lucide-react';

interface CommunitySectionProps {
    creatorName: string;
}

export default function CommunitySection({ creatorName }: CommunitySectionProps) {
    const posts = [
        {
            id: 1,
            content: "Just dropped a new set of Lightroom presets! Let me know what you think in the comments. 📸",
            date: "2 hours ago",
            likes: 124,
            comments: 45,
            image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop"
        },
        {
            id: 2,
            content: "Working on a complete guide to freelance photography in India. What topics should I cover?",
            date: "1 day ago",
            likes: 89,
            comments: 124
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Community Updates</h2>
                <button className="text-sm font-bold text-purple-600 hover:text-purple-700">View All</button>
            </div>

            <div className="space-y-6">
                {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100" />
                                <div>
                                    <p className="font-bold text-gray-900">{creatorName}</p>
                                    <p className="text-xs text-gray-500">{post.date}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

                        {post.image && (
                            <div className="mb-4 rounded-xl overflow-hidden aspect-video">
                                <img src={post.image} alt="Post attachment" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                            <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group">
                                <Heart className="w-5 h-5 group-hover:fill-current" />
                                <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-sm font-medium">{post.comments}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors ml-auto">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
