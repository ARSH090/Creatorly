'use client';

import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Heart, Share2, MoreVertical,
    Send, Image as ImageIcon, Sparkles, Lock, Loader2,
    Users, Globe, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function MemberFeed({ params }: { params: { username: string } }) {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        async function fetchFeed() {
            try {
                // In a real scenario, this would check if the user has an active membership/course
                const response = await fetch(`/api/community/${params.username}`);
                if (!response.ok) {
                    if (response.status === 403) router.push(`/u/${params.username}`);
                    throw new Error('Failed to fetch feed');
                }
                const data = await response.json();
                setPosts(data.posts || []);
            } catch (error) {
                console.error('Feed Fetch Error:', error);
                // Mock posts for demonstration
                setPosts([
                    {
                        id: '1',
                        author: params.username,
                        content: "Hey everyone! Just uploaded the new presets for this month. Check them out in the digital downloads section if you're on the Pro tier! 🚀",
                        likes: 42,
                        comments: 12,
                        timestamp: '2 hours ago',
                        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000'
                    },
                    {
                        id: '2',
                        author: params.username,
                        content: "Working on a new masterclass about storytelling. What's the #1 struggle you face when planning your content?",
                        likes: 89,
                        comments: 45,
                        timestamp: '1 day ago'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        }

        if (authStatus === 'authenticated') fetchFeed();
        else if (authStatus === 'unauthenticated') router.push(`/u/${params.username}`);
    }, [params.username, authStatus]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            <header className="h-20 border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="font-black text-sm uppercase tracking-widest text-zinc-500">Community</h1>
                        <p className="text-xl font-bold">Member Feed</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push(`/u/${params.username}`)}
                    className="bg-white/5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                    Back to Store
                </button>
            </header>

            <main className="max-w-2xl mx-auto py-12 px-6 space-y-8 pb-32">
                {/* Announcement Card */}
                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/0 border border-indigo-500/30 rounded-[2.5rem] p-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <h2 className="font-black uppercase tracking-widest text-xs text-indigo-300">Exclusive Content</h2>
                    </div>
                    <p className="text-zinc-300 font-medium leasing-relaxed">
                        Welcome to the inner circle. This is where I share raw updates, early access links, and community polls. Thanks for being a member!
                    </p>
                </div>

                {/* Posts Feed */}
                <div className="space-y-6">
                    {posts.map((post, idx) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-colors"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/5" />
                                        <div>
                                            <h3 className="font-bold text-lg">@{post.author}</h3>
                                            <p className="text-xs text-zinc-500 font-medium">{post.timestamp}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-zinc-300 leading-relaxed font-medium">
                                    {post.content}
                                </p>

                                {post.image && (
                                    <div className="aspect-video rounded-3xl overflow-hidden border border-white/5">
                                        <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-6">
                                        <button className="flex items-center gap-2 text-zinc-500 hover:text-rose-400 transition-colors group">
                                            <Heart className="w-5 h-5 group-hover:fill-rose-400" />
                                            <span className="text-sm font-bold">{post.likes}</span>
                                        </button>
                                        <button className="flex items-center gap-2 text-zinc-500 hover:text-indigo-400 transition-colors">
                                            <MessageSquare className="w-5 h-5" />
                                            <span className="text-sm font-bold">{post.comments}</span>
                                        </button>
                                    </div>
                                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Sticky Comment / Share Bar Mock */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
                <div className="bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 flex items-center gap-3 shadow-2xl">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-5 h-5 text-zinc-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Say something to the community..."
                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-white placeholder-zinc-500"
                    />
                    <button className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/40">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
