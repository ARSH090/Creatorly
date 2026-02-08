'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterFormContent() {
    const [formData, setFormData] = useState({
        username: '',
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
        if (!formData.username.trim()) {
            setError('Choose a username for your profile');
            setLoading(false);
            return;
        }
        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters');
            setLoading(false);
            return;
        }
        if (!/^[a-z0-9_-]+$/.test(formData.username)) {
            setError('Username can only contain letters, numbers, hyphens, and underscores');
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

            setSuccess('Account created! Redirecting to login...');
            setTimeout(() => {
                router.push('/auth/login?registered=true');
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold border border-red-200">
                    ✗ {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-bold border border-green-200">
                    ✓ {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Your Name</label>
                    <input
                        type="text"
                        required
                        autoComplete="name"
                        className="w-full px-5 py-3 bg-slate-100 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder-slate-500"
                        placeholder="Priya Sharma"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                    <p className="text-xs text-slate-600 mt-1">This is how creators will see your name</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Your Username</label>
                    <div className="flex items-center bg-slate-100 border border-slate-300 rounded-2xl px-5 py-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 focus-within:bg-white transition-all">
                        <span className="text-slate-600 font-medium">creatorly.link/</span>
                        <input
                            type="text"
                            required
                            autoComplete="username"
                            className="flex-1 bg-transparent outline-none font-medium text-slate-900 placeholder-slate-500"
                            placeholder="priya"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                        />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">3-20 characters. This is your unique link</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Email Address</label>
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        className="w-full px-5 py-3 bg-slate-100 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder-slate-500"
                        placeholder="priya@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <p className="text-xs text-slate-600 mt-1">We'll send a confirmation link here</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Password</label>
                    <input
                        type="password"
                        required
                        autoComplete="new-password"
                        className="w-full px-5 py-3 bg-slate-100 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder-slate-500"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <p className="text-xs text-slate-600 mt-1">At least 6 characters. Keep it secure!</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-6 bg-linear-to-r from-orange-600 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:scale-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span> Creating your account...
                        </span>
                    ) : (
                        '🚀 Get Started for Free'
                    )}
                </button>

                <p className="text-xs text-slate-600 text-center">
                    By signing up, you agree to our {' '}
                    <Link href="/terms-of-service" className="text-orange-600 font-bold hover:text-orange-700">
                        Terms
                    </Link>
                    {' '} and {' '}
                    <Link href="/privacy-policy" className="text-orange-600 font-bold hover:text-orange-700">
                        Privacy Policy
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Top Navigation */}
            <div className="border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-black bg-linear-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                        Creatorly
                    </Link>
                    <div className="text-sm text-slate-600">
                        Already have an account? {' '}
                        <Link href="/auth/login" className="font-bold text-orange-600 hover:text-orange-700">
                            Log in
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 min-h-[calc(100vh-80px)]">
                {/* Left: Sign-up form */}
                <div className="flex items-center justify-center p-6 sm:p-8 bg-white">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
                                Build Your Creator Store
                            </h1>
                            <p className="text-lg text-slate-600">
                                Join creators earning ₹2L+ monthly selling directly to their audience
                            </p>
                        </div>

                        <Suspense fallback={<div className="text-center text-slate-600">Loading...</div>}>
                            <RegisterFormContent />
                        </Suspense>

                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">What you get</p>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <span className="text-lg mt-0.5">🔗</span>
                                    <span className="text-slate-700"><strong>Custom Bio Link</strong> - Share one link everywhere</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-lg mt-0.5">💰</span>
                                    <span className="text-slate-700"><strong>Instant Payouts</strong> - Get paid within 24 hours</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-lg mt-0.5">📊</span>
                                    <span className="text-slate-700"><strong>Real Analytics</strong> - See what sells</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-lg mt-0.5">🎨</span>
                                    <span className="text-slate-700"><strong>No Design Skills</strong> - Pre-made templates ready to use</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right: Social Proof and Benefits */}
                <div className="hidden md:flex flex-col items-center justify-center p-8 bg-linear-to-br from-orange-50 via-pink-50 to-purple-50">
                    <div className="max-w-md">
                        <div className="mb-12">
                            <h2 className="text-2xl font-black text-slate-900 mb-4">
                                1000+ Creators Earning on Creatorly
                            </h2>
                            <p className="text-slate-700 leading-relaxed">
                                From Instagram influencers to YouTube creators, coaches to consultants - all growing their income with Creatorly.
                            </p>
                        </div>

                        {/* Testimonials */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-lg">⭐</span>
                                    ))}
                                </div>
                                <p className="text-slate-700 font-medium mb-3">
                                    "Went from 0 to ₹2,50,000 in first month. The platform is so simple!"
                                </p>
                                <p className="text-sm font-bold text-slate-900">Arjun Patel</p>
                                <p className="text-xs text-slate-600">Tech YouTuber • 500K subscribers</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-lg">⭐</span>
                                    ))}
                                </div>
                                <p className="text-slate-700 font-medium mb-3">
                                    "My 1-on-1 consultations bookings tripled. Best decision ever!"
                                </p>
                                <p className="text-sm font-bold text-slate-900">Anaya Gupta</p>
                                <p className="text-xs text-slate-600">Life Coach • 50K followers</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-lg">⭐</span>
                                    ))}
                                </div>
                                <p className="text-slate-700 font-medium mb-3">
                                    "My digital course now sells automatically on my bio link. Passive income!"
                                </p>
                                <p className="text-sm font-bold text-slate-900">Priya Sharma</p>
                                <p className="text-xs text-slate-600">Fashion Influencer • 150K followers</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-300">
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Trusted by creators from</p>
                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
                                    <span>📱 Instagram</span>
                                    <span>•</span>
                                    <span>📺 YouTube</span>
                                    <span>•</span>
                                    <span>𝕏 Twitter</span>
                                    <span>•</span>
                                    <span>📘 LinkedIn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
