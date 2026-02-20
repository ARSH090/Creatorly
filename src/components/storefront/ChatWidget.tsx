'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPusherClient } from '@/lib/pusher';
import { useAuth } from '@/hooks/useAuth';

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
}

export default function ChatWidget({ creatorId }: { creatorId: string }) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen || !user) return;

        // Fetch history
        fetch(`/api/chat/messages?otherUserId=${creatorId}`)
            .then(res => res.json())
            .then(data => setMessages(data.messages || []));

        // Subscribe to Pusher
        const channelName = [user.id, creatorId].sort().join('--');
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`chat--${channelName}`);

        channel.bind('new-message', (data: Message) => {
            setMessages(prev => [...prev, data]);
        });

        return () => {
            pusher.unsubscribe(`chat--${channelName}`);
        };
    }, [isOpen, user, creatorId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        setLoading(true);
        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: creatorId, content: input })
            });
            if (res.ok) setInput('');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null; // Chat only for logged in users in this version

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-96 h-[500px] bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between">
                            <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">Chat with Creator</h3>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderId === user.id
                                        ? 'bg-indigo-500 text-white rounded-br-none'
                                        : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Write a message..."
                                className="flex-1 bg-zinc-800 border-none rounded-xl text-sm px-4 py-2 focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-500 hover:bg-indigo-600 p-2 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/20 transition-all hover:scale-110 active:scale-95"
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
            </button>
        </div>
    );
}
