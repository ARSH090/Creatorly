'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Lock, ArrowLeft, Send, Image as ImageIcon, Loader2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
    id: string;
    author: string;
    content: string;
    likes: number;
    comments: number;
    timestamp: string;
    image?: string;
    createdAt?: string;
}

export default function CommunityPage() {
    const params = useParams();
    const username = params.username as string;

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [newPost, setNewPost] = useState('');
    const [posting, setPosting] = useState(false);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/community/${username}`);
            if (res.status === 403) {
                setAccessDenied(true);
                return;
            }
            const data = await res.json();
            if (res.ok) setPosts(data.posts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [username]);

    const handleLike = (postId: string) => {
        setLikedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
                setPosts(p => p.map(post => post.id === postId ? { ...post, likes: post.likes - 1 } : post));
            } else {
                newSet.add(postId);
                setPosts(p => p.map(post => post.id === postId ? { ...post, likes: post.likes + 1 } : post));
            }
            return newSet;
        });
    };

    const handlePost = async () => {
        if (!newPost.trim()) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/community/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newPost })
            });
            if (res.ok) {
                setNewPost('');
                await fetchPosts();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPosting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
                <div className="text-center space-y-6 max-w-sm">
                    <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/10">
                        <Lock className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Members Only</h2>
                    <p className="text-zinc-500 text-sm">
                        Join <span className="text-indigo-400 font-bold">@{username}</span>'s community by purchasing one of their products or subscribing.
                    </p>
                    <Link
                        href={`/u/${username}`}
                        className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> View Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#030303]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/u/${username}`} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-zinc-400" />
                        </Link>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-wide">Community</h1>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">@{username}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                        <Users className="w-3.5 h-3.5" />
                        {posts.length} posts
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {/* Post composer */}
                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 space-y-4">
                    <textarea
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        placeholder={`Share something with the community...`}
                        rows={3}
                        className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <button className="p-2 rounded-xl text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-all">
                            <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handlePost}
                            disabled={posting || !newPost.trim()}
                            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Post
                        </button>
                    </div>
                </div>

                {/* Feed */}
                {posts.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <MessageCircle className="w-8 h-8 text-zinc-700" />
                        </div>
                        <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest">No posts yet</p>
                        <p className="text-zinc-700 text-xs">Be the first to post in this community!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <article key={post.id} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all">
                                {/* Author row */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm">
                                        {post.author[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white uppercase tracking-wider">@{post.author}</p>
                                        <p className="text-[10px] text-zinc-600 font-medium">{post.timestamp}</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <p className="text-sm text-zinc-300 leading-relaxed">{post.content}</p>

                                {/* Image */}
                                {post.image && (
                                    <div className="rounded-2xl overflow-hidden bg-zinc-900">
                                        <img src={post.image} alt="Post media" className="w-full max-h-80 object-cover" />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-6 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className={`flex items-center gap-2 text-xs font-bold transition-all
                                            ${likedPosts.has(post.id) ? 'text-rose-400' : 'text-zinc-600 hover:text-rose-400'}`}
                                    >
                                        <Heart className={`w-4 h-4 transition-all ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                        {post.likes}
                                    </button>
                                    <button className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-indigo-400 transition-all">
                                        <MessageCircle className="w-4 h-4" />
                                        {post.comments}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
