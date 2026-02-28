'use client';

import React from 'react';
import { LifeBuoy, MessageSquare, BookOpen, Mail } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20">
                    <LifeBuoy className="w-10 h-10 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-black text-white">Help & Support</h1>
                <p className="text-zinc-500 max-w-lg mx-auto">We&apos;re here to help you succeed. Find answers in our documentation or talk to our team.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer">
                    <BookOpen className="w-8 h-8 text-indigo-400 mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Documentation</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">Learn how to set up your store, manage products, and scale your brand.</p>
                </div>
                <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer">
                    <MessageSquare className="w-8 h-8 text-purple-400 mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Live Chat</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">Available for Pro and Enterprise creators. Get instant help from our team.</p>
                </div>
            </div>

            <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <Mail className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Email Support</h3>
                        <p className="text-xs text-zinc-500">support@creatorly.in</p>
                    </div>
                </div>
                <button className="bg-white text-black font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                    Send Email
                </button>
            </div>
        </div>
    );
}
