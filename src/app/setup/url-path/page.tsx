'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SetupUrlPath() {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (username.length < 3) {
            setError('URL Path must be at least 3 characters');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/user/update-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to claim URL. Try another name.');
                setLoading(false);
                return;
            }

            setSuccess(true);
            // Update session to reflect new username
            await refreshUser();

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (err: any) {
            setError('A system error occurred. Please try again.');
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans antialiased selection:bg-indigo-500/30">
            {/* Background Noise & Grid */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
                <div className="max-w-md w-full">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/8 bg-white/2 mb-6">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Final Step</span>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tighter text-white mb-4">Claim Your Domain</h1>
                        <p className="text-zinc-500 font-medium">Choose how the world finds your digital storefront.</p>
                    </div>

                    <div className="bg-zinc-900/40 border border-white/8 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-[11px] font-bold border border-red-500/20 mb-6 animate-in fade-in slide-in-from-top-2">
                                ✗ {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl text-[11px] font-bold border border-emerald-500/20 mb-6 animate-in fade-in slide-in-from-top-2">
                                ✓ URL Secured! Redirecting...
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Professional URL</label>
                                <div className="flex items-center bg-white/3 border border-white/8 rounded-2xl px-5 py-4 focus-within:border-indigo-500/50 focus-within:bg-white/5 transition-all">
                                    <span className="text-zinc-600 font-bold">creatorly.link/</span>
                                    <input
                                        type="text"
                                        required
                                        className="flex-1 bg-transparent outline-none font-bold text-white placeholder-zinc-800"
                                        placeholder="yourname"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-600 ml-1">Use letters, numbers, hyphens, and underscores only.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                {loading ? 'Securing...' : 'Claim My URL'}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/dashboard')}
                                className="w-full text-[10px] text-zinc-600 font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors py-2"
                            >
                                Do this later
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
