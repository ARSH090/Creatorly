'use client';

import React, { useState } from 'react';
import { Mail, Loader2, Check } from 'lucide-react';
import type { NewsletterSettings } from '@/types/storefront-blocks.types';

interface NewsletterWidgetProps {
    settings: NewsletterSettings;
    theme: Record<string, string>;
    creatorId?: string;
}

export default function NewsletterWidget({ settings, theme, creatorId }: NewsletterWidgetProps) {
    const {
        heading = 'Join the newsletter',
        subheading = 'Get weekly tips delivered to your inbox.',
        buttonText = 'Subscribe',
        successMessage = "You're in! 🎉",
        showGdpr = false,
        gdprText = 'I agree to receive emails. Unsubscribe anytime.',
        leadMagnet,
    } = settings;

    const [email, setEmail] = useState('');
    const [gdpr, setGdpr] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const borderRadius = Number(theme.borderRadius || 12);
    const primaryColor = theme.primaryColor || '#6366f1';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        if (showGdpr && !gdpr) { setError('Please accept the terms.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, creatorId }),
            });
            if (!res.ok) throw new Error('Failed to subscribe');
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-10 space-y-3">
                <div
                    className="w-16 h-16 mx-auto flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}22`, borderRadius: 999 }}
                >
                    <Check size={28} style={{ color: primaryColor }} />
                </div>
                <p className="text-xl font-black" style={{ color: theme.textColor || '#fff' }}>{successMessage}</p>
            </div>
        );
    }

    return (
        <div
            className="w-full max-w-lg mx-auto p-8 space-y-5"
            style={{
                backgroundColor: theme.cardColor || 'rgba(255,255,255,0.04)',
                borderRadius,
                border: `1px solid ${primaryColor}22`,
            }}
        >
            <div className="text-center space-y-2">
                <div
                    className="w-12 h-12 mx-auto flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${primaryColor}22`, borderRadius: 999 }}
                >
                    <Mail size={22} style={{ color: primaryColor }} />
                </div>
                <h3 className="text-2xl font-black" style={{ color: theme.textColor || '#fff' }}>{heading}</h3>
                {subheading && <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{subheading}</p>}
                {leadMagnet && (
                    <p className="text-sm font-bold" style={{ color: primaryColor }}>
                        🎁 {leadMagnet}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                        type="email"
                        required
                        placeholder="Your email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="flex-1 px-4 py-3 text-sm outline-none placeholder-current"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius,
                            color: theme.textColor || '#fff',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ backgroundColor: primaryColor, borderRadius, color: '#fff' }}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        {buttonText}
                    </button>
                </div>

                {showGdpr && (
                    <label className="flex items-start gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={gdpr}
                            onChange={e => setGdpr(e.target.checked)}
                            className="mt-0.5"
                        />
                        <span className="text-xs opacity-50" style={{ color: theme.textColor }}>{gdprText}</span>
                    </label>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}
            </form>
        </div>
    );
}
