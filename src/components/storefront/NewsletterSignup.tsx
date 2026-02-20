'use client';

import React, { useState } from 'react';
import { Send, Check, Loader2 } from 'lucide-react';

interface NewsletterSignupProps {
    creatorId: string;
    theme: any;
}

export default function NewsletterSignup({ creatorId, theme }: NewsletterSignupProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/emails/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, creatorId })
            });

            if (res.ok) setStatus('success');
            else setStatus('error');
        } catch (err) {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold">You're on the list!</h3>
                <p className="text-zinc-500 text-sm">Thanks for subscribing to my updates.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-6 sm:space-y-8">
            <div className="space-y-2 text-center">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Join the Inner Circle</h3>
                <p className="text-zinc-500 text-[12px] sm:text-sm font-medium">Get exclusive content and early access to new products.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    id="newsletter-email"
                    type="email"
                    placeholder="Enter your email"
                    aria-label="Email address for newsletter"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
                <button
                    disabled={status === 'loading'}
                    className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] shadow-2xl flex items-center justify-center gap-3 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
                    style={{
                        backgroundColor: theme.primaryColor || '#6366f1',
                        color: '#fff',
                        boxShadow: `0 10px 30px ${theme.primaryColor || '#6366f1'}30`
                    }}
                >
                    {status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Get Updates
                            <Send className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <p className="text-[10px] text-zinc-600 text-center font-bold uppercase tracking-widest">
                No spam. Unsubscribe anytime.
            </p>
        </div>
    );
}
