'use client';

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

import { useState } from 'react';
import { Heart, MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
    id: string;
    author: string;
    authorAvatar?: string;
    content: string;
    likes: number;
    likedByMe?: boolean;
    comments: number;
    timestamp: string;
    image?: string;
}

interface Comment {
    id: string;
    content: string;
    author: string;
    authorAvatar?: string;
    createdAt: string;
}

interface PostCardProps {
    post: Post;
    communityUsername: string;
    onLikeToggle: (postId: string, newLikedState: boolean) => void;
}

export default function PostCard({ post, communityUsername, onLikeToggle }: PostCardProps) {
    const [likes, setLikes] = useState(post.likes);
    const [liked, setLiked] = useState(post.likedByMe || false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [commentCount, setCommentCount] = useState(post.comments);

    const handleLike = async () => {
        // Optimistic update
        const previousLiked = liked;
        const previousLikes = likes;
        setLiked(!liked);
        setLikes(prev => liked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`/api/community/${communityUsername}/posts/${post.id}/like`, {
                method: 'POST'
            });
            if (!res.ok) {
                // Revert
                setLiked(previousLiked);
                setLikes(previousLikes);
            } else {
                onLikeToggle(post.id, !previousLiked); // Sync up if needed
            }
        } catch (err) {
            console.error(err);
            setLiked(previousLiked);
            setLikes(previousLikes);
        }
    };

    const fetchComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }
        setLoadingComments(true);
        setShowComments(true);
        try {
            const res = await fetch(`/api/community/${communityUsername}/posts/${post.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setPostingComment(true);
        try {
            const res = await fetch(`/api/community/${communityUsername}/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });

            if (res.ok) {
                const data = await res.json();
                setComments(prev => [...prev, {
                    id: data.comment.id,
                    content: data.comment.content,
                    author: data.comment.author,
                    authorAvatar: data.comment.authorAvatar,
                    createdAt: data.comment.createdAt
                }]);
                setNewComment('');
                setCommentCount(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPostingComment(false);
        }
    };

    return (
        <article className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all">
            {/* Author row */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm overflow-hidden border border-white/10">
                    {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt={post.author} className="w-full h-full object-cover" />
                    ) : (
                        post.author[0]?.toUpperCase()
                    )}
                </div>
                <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">@{post.author}</p>
                    <p className="text-[10px] text-zinc-600 font-medium">{post.timestamp}</p>
                </div>
            </div>

            {/* Content */}
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>

            {/* Image */}
            {post.image && (
                <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                    <img src={post.image} alt="Post media" className="w-full max-h-80 object-cover" />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-2 border-t border-white/5">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 text-xs font-bold transition-all
                        ${liked ? 'text-rose-400' : 'text-zinc-600 hover:text-rose-400'}`}
                >
                    <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-current' : ''}`} />
                    {likes}
                </button>
                <button
                    onClick={fetchComments}
                    className={`flex items-center gap-2 text-xs font-bold transition-all ${showComments ? 'text-indigo-400' : 'text-zinc-600 hover:text-indigo-400'}`}
                >
                    <MessageCircle className="w-4 h-4" />
                    {commentCount}
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    {loadingComments ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4 pl-4 border-l border-white/5">
                            {comments.map(comment => (
                                <div key={comment.id} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                                            {comment.author[0].toUpperCase()}
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400">@{comment.author}</span>
                                        <span className="text-[10px] text-zinc-600">• {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-xs text-zinc-300 pl-6">{comment.content}</p>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-xs text-zinc-600 italic">No comments yet.</p>
                            )}
                        </div>
                    )}

                    {/* Comment Input */}
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        />
                        <button
                            onClick={handlePostComment}
                            disabled={!newComment.trim() || postingComment}
                            className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white disabled:opacity-50 transition-colors"
                        >
                            {postingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}
