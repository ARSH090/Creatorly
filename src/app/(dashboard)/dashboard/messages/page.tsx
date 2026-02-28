'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Search, Send, User as UserIcon, Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { getPusherClient } from '@/lib/pusher';

export default function MessagesPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConv, setActiveConv] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch conversations list
    const fetchConversations = async () => {
        const res = await fetch('/api/chat/conversations');
        const data = await res.json();
        if (res.ok) setConversations(data.conversations || []);
    };

    useEffect(() => {
        if (user) fetchConversations();
    }, [user]);

    // Fetch messages for active conversation
    useEffect(() => {
        if (!activeConv || !user) return;

        const loadMessages = async () => {
            setLoadingMessages(true);
            const res = await fetch(`/api/chat/messages?otherUserId=${activeConv.user._id}`);
            const data = await res.json();
            if (res.ok) setMessages(data.messages || []);
            setLoadingMessages(false);
        };

        loadMessages();

        // Pusher Subscription
        const channelName = [user.id, activeConv.user._id].sort().join('--');
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`chat--${channelName}`);

        channel.bind('new-message', (data: any) => {
            setMessages(prev => [...prev, data]);
            fetchConversations(); // Refresh last message in list
        });

        return () => {
            pusher.unsubscribe(`chat--${channelName}`);
        };
    }, [activeConv, user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeConv || !user) return;

        setSending(true);
        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: activeConv.user._id, content: input })
            });
            if (res.ok) setInput('');
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    if (!user) return null;

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-120px)] overflow-hidden bg-black/50 border border-white/5 rounded-[2.5rem] mt-6 mx-6">
                {/* Sidebar */}
                <div className="w-96 border-r border-white/5 flex flex-col bg-[#050505]">
                    <div className="p-8">
                        <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-6">Messages</h1>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                placeholder="Search conversations..."
                                className="w-full bg-white/5 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                        {conversations.length === 0 ? (
                            <div className="text-center py-20">
                                <MessageCircle className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest">No messages yet</p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv.user._id}
                                    onClick={() => setActiveConv(conv)}
                                    className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all group ${activeConv?.user._id === conv.user._id
                                        ? 'bg-indigo-500'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5 shadow-2xl">
                                        {conv.user.avatar ? (
                                            <img src={conv.user.avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-5 h-5 text-zinc-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={`font-black text-xs uppercase tracking-widest ${activeConv?.user._id === conv.user._id ? 'text-white' : 'text-zinc-400'}`}>
                                                {conv.user.displayName || conv.user.username}
                                            </p>
                                            <span className={`text-[10px] font-bold ${activeConv?.user._id === conv.user._id ? 'text-white/60' : 'text-zinc-700'}`}>
                                                {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${activeConv?.user._id === conv.user._id ? 'text-white/80 font-medium' : 'text-zinc-500'}`}>
                                            {conv.lastMessage.content}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-[#030303]">
                    {activeConv ? (
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/10 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5">
                                        {activeConv.user.avatar ? <img src={activeConv.user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-zinc-600" />}
                                    </div>
                                    <div>
                                        <p className="font-black text-xs uppercase tracking-widest text-white">{activeConv.user.displayName || activeConv.user.username}</p>
                                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active Now</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg._id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className="space-y-2 max-w-[60%]">
                                                <div className={`p-4 rounded-[2rem] text-sm leading-relaxed shadow-2xl ${msg.senderId === user.id
                                                    ? 'bg-indigo-500 text-white rounded-br-none shadow-indigo-500/10'
                                                    : 'bg-[#111] border border-white/5 text-zinc-300 rounded-bl-none'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest text-zinc-700 px-2 ${msg.senderId === user.id ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-8 bg-zinc-900/20 backdrop-blur-3xl">
                                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your response..."
                                        className="w-full bg-white/5 border border-white/5 rounded-3xl pl-8 pr-16 py-5 text-sm focus:ring-1 focus:ring-indigo-500 transition-all focus:bg-white/[0.07] group-hover:border-white/10"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !input.trim()}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-500 hover:bg-indigo-600 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 active:scale-95"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-20 text-center">
                            <div className="max-w-md space-y-6">
                                <div className="w-24 h-24 bg-indigo-500/5 border border-indigo-500/10 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/10">
                                    <MessageCircle className="w-10 h-10 text-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Select a Conversation</h2>
                                    <p className="text-zinc-500 text-sm font-medium">Choose a customer from the left to start real-time messaging. Stay connected with your audience.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
