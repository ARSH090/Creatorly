'use client';

import React, { useState } from 'react';
import {
    LifeBuoy,
    MessageSquare,
    BookOpen,
    Mail,
    Search,
    ChevronRight,
    ExternalLink,
    Send,
    PlayCircle,
    FileText,
    Zap,
    Shield
} from 'lucide-react';

const CATEGORIES = [
    { id: 'start', title: 'Getting Started', icon: PlayCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', count: 12 },
    { id: 'billing', title: 'Billing & Plans', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10', count: 8 },
    { id: 'automation', title: 'AutoDM Engine', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10', count: 15 },
    { id: 'security', title: 'Security', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-400/10', count: 5 },
];

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[40px] bg-indigo-600 p-12 text-center space-y-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="relative space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
                        How can we help you?
                    </h1>
                    <p className="text-indigo-100 max-w-lg mx-auto font-medium">
                        Search our knowledge base or browse categories below to find answers quickly.
                    </p>
                </div>

                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search for articles, guides, or keywords..."
                        className="w-full bg-white rounded-2xl py-5 pl-16 pr-6 text-black font-medium focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all shadow-2xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Quick Stats/Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 rounded-3xl p-6 transition-all cursor-pointer group">
                        <div className={`w-12 h-12 ${cat.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <cat.icon className={`w-6 h-6 ${cat.color}`} />
                        </div>
                        <h3 className="font-bold text-white mb-1">{cat.title}</h3>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{cat.count} Articles</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: FAQs */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-white px-2">Popular Questions</h2>
                    <div className="space-y-4">
                        {[
                            "How do I connect my Instagram account?",
                            "What is the daily DM limit?",
                            "How to set up automated replies?",
                            "Can I cancel my subscription anytime?",
                            "How to export lead data?"
                        ].map((q, i) => (
                            <div key={i} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-indigo-500/30 transition-all cursor-pointer group">
                                <span className="font-bold text-zinc-300 group-hover:text-white transition-colors">{q}</span>
                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 font-bold hover:text-white transition-colors flex items-center justify-center gap-2">
                        View All Articles <ExternalLink className="w-4 h-4" />
                    </button>
                </div>

                {/* Sidebar: Contact Support */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Direct Support</h3>
                            <p className="text-zinc-500 text-sm">Can't find what you need? Talk to our team.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-black rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Live Chat</span>
                                </div>
                                <p className="text-sm text-zinc-500 mb-4">Availability: 10AM - 8PM IST</p>
                                <button className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-200 transition-colors">
                                    Start Chat
                                </button>
                            </div>

                            <div className="p-4 bg-black rounded-2xl border border-white/5 text-center">
                                <Mail className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                                <p className="text-sm font-bold text-white">Email Us</p>
                                <p className="text-xs text-zinc-600 mb-4">support@creatorly.in</p>
                                <button className="w-full py-3 bg-zinc-800 text-zinc-300 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-700 transition-colors">
                                    Send Email
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center">
                                Pro Priority Support: <span className="text-indigo-400">ACTIVE</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

