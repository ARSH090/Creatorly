'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

function RegisterFormContent() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Pre-fill email from URL parameter if provided
    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validation
        if (!formData.displayName.trim()) {
            setError('Your name is required');
            setLoading(false);
            return;
        }
        if (!formData.email.includes('@')) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Something went wrong. Please try again.');
                setLoading(false);
                return;
            }

            // Auto sign-in after successful registration for smoother UX
            const signInResult = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (signInResult?.error) {
                // If auto sign-in failed, redirect to login with helpful message
                setSuccess('Account created. Please sign in.');
                setTimeout(() => {
                    router.push('/auth/login?registered=true');
                }, 1200);
                setLoading(false);
                return;
            }

            // Successful sign in -> redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                    ✗ {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl text-sm font-bold border border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
                    ✓ {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Identity</label>
                        <input
                            type="text"
                            required
                            autoComplete="name"
                            className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-4xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                        placeholder="Full Name (e.g. Priya Sharma)"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Connectivity</label>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Security</label>
                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin text-lg">⏳</span> Initializing...
                        </span>
                    ) : (
                        'Claim Your Storefront'
                    )}
                </button>

                <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-wider">
                    Registration indicates acceptance of our {' '}
                    <Link href="/terms-of-service" className="text-white hover:underline">
                        Legal Terms
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
            {/* Background Noise & Grid */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* Top Navigation moved to global Header for consistent spacing */}

            <main className="relative z-10 pt-20 pb-12 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
                    {/* Left: Branding Content */}
                    <div className="hidden md:block">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/8 bg-white/2 mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Scale Your Influence</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-medium tracking-tighter text-white leading-[0.9] mb-8">
                            Join the <br />
                            <span className="text-zinc-600 italic">top 1%</span> creators.
                        </h1>

                        <div className="space-y-8 mt-12">
                            {[
                                { t: 'Unified Infrastructure', d: 'One dashboard to manage products, payments, and settlements.' },
                                { t: 'Zero Platform Tax', d: 'Keep 100% of your earnings (minus standard gateway fees).' },
                                { t: 'Enterprise Security', d: 'Your data and revenue protected by military-grade encryption.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="mt-1 w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-zinc-600 font-bold text-[10px]">
                                        0{i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1 uppercase tracking-widest text-[11px]">{item.t}</h4>
                                        <p className="text-sm text-zinc-500 leading-relaxed">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Sign-up Form */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full -z-10" />
                        <div className="bg-zinc-900/40 border border-white/8 backdrop-blur-3xl rounded-4xl p-8 md:p-12">
                            <h2 className="text-3xl font-medium tracking-tight text-white mb-2">Get Started</h2>
                            <p className="text-zinc-500 text-sm mb-10">Create your professional creator ID in minutes.</p>

                            <Suspense fallback={<div className="text-zinc-500 animate-pulse">Establishing secure connection...</div>}>
                                <RegisterFormContent />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-20 border-t border-white/5 bg-[#020202]">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:row justify-between items-center gap-6 opacity-40">
                    <span className="text-xl font-black text-white tracking-tighter">Creatorly</span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Built for the Next Billion • Bharat 🇮🇳</p>
                </div>
            </footer>
        </div>
    );
}
