'use client';

import { useState, Suspense } from 'react';
import { useSignUp, useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, CheckCircle, Smartphone } from 'lucide-react';

function RegisterFormContent() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { isLoaded: isSignInLoaded, signIn } = useSignIn();

    // UI State
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const router = useRouter();

    const handleGoogleSignUp = async () => {
        if (!isLoaded) return;
        try {
            setLoading(true);
            await signUp.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/dashboard',
            });
        } catch (err: any) {
            console.error('Google Sign Up Error:', err);
            setError(err.errors?.[0]?.message || 'Google sign-up failed');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError('');

        // Basic validation
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
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            // 1. Create Sign Up Attempt
            await signUp.create({
                emailAddress: formData.email,
                password: formData.password,
                firstName: formData.displayName.split(' ')[0],
                lastName: formData.displayName.split(' ').slice(1).join(' '),
            });

            // 2. Prepare Verification
            await signUp.prepareVerification({
                strategy: 'email_code'
            });

            setPendingVerification(true);
        } catch (err: any) {
            console.error('Registration error:', err);
            // Handle specific Clerk errors
            if (err.errors?.[0]?.code === 'form_identifier_exists') {
                setError('This account already exists. Please log in.');
            } else if (err.errors?.[0]?.code === 'password_complexity') {
                setError('Password is too weak. Use mix of chars/numbers.');
            } else if (err.errors?.[0]?.meta?.paramName === 'captcha') {
                setError('CAPTCHA check failed. Please refresh and try again.');
            } else {
                setError(err.errors?.[0]?.message || 'Failed to create account.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError('');

        try {
            const completeSignUp = await signUp.attemptVerification({
                strategy: 'email_code',
                code: verificationCode,
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                window.location.href = '/dashboard';
            } else if (completeSignUp.status === 'missing_requirements') {
                console.error("Missing requirements:", completeSignUp.missingFields);
                setError('Account created but missing requirements (e.g. verified phone). Please contact support.');
            } else {
                console.log(JSON.stringify(completeSignUp, null, 2));
                setError('Verification incomplete. Please try again.');
            }
        } catch (err: any) {
            console.error('Verification Error:', err);
            if (err.errors?.[0]?.code === 'verification_already_verified') {
                // Even if already verified, we need to check if we can proceed
                // But typically this means we are missing requirements if access is not granted.
                // We can try to reload or check status. 
                // For now, let's just warn the user.
                setError('Email already verified, but account setup is incomplete. See previous error regarding requirements.');
            } else {
                setError(err.errors?.[0]?.message || 'Invalid verification code');
            }
        } finally {
            setLoading(false);
        }
    };

    // Verification UI
    if (pendingVerification) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center space-y-2 mb-8">
                    <div className="mx-auto w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mb-4 ring-4 ring-indigo-500/10">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-medium tracking-tight text-white">Verify Email</h2>
                    <p className="text-zinc-500 text-sm">We sent a verification code to <span className="text-white font-medium">{formData.email}</span></p>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-500/20 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerification} className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-center gap-3">
                            {/* Visual pseudo-input for verification code */}
                            <input
                                type="text"
                                required
                                autoFocus
                                className="w-full max-w-[200px] px-4 py-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-indigo-500/50 focus:bg-zinc-900 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-mono text-white placeholder-zinc-700 text-center text-3xl tracking-[0.5em]"
                                placeholder="000000"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                        <p className="text-center text-xs text-zinc-500 uppercase tracking-widest font-bold">Enter 6-digit Code</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setPendingVerification(false)}
                            className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            Use different email
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-10">
                <h2 className="text-3xl font-medium tracking-tight text-white mb-2">Get Started</h2>
                <p className="text-zinc-500 text-sm">Create your professional creator ID in minutes.</p>
            </div>

            <div id="clerk-captcha" /> {/* Explicit CAPTCHA mount point */}

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                    ✗ {error}
                </div>
            )}

            <div className="space-y-4">
                <button
                    onClick={handleGoogleSignUp}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] font-bold text-sm"
                    type="button"
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.6 12.227C21.6 11.549 21.547 10.953 21.444 10.381H12v3.889h5.787c-.249 1.342-.98 2.486-2.093 3.265v2.717h3.387c1.983-1.828 3.119-4.515 3.119-7.87z" fill="#4285F4" />
                        <path d="M12 22c2.7 0 4.966-.89 6.622-2.41l-3.387-2.717c-.94.633-2.144 1.01-3.235 1.01-2.487 0-4.598-1.68-5.352-3.94H2.993v2.47C4.64 19.99 8.02 22 12 22z" fill="#34A853" />
                        <path d="M6.648 13.943a6.6 6.6 0 010-3.886V7.588H2.993a10.998 10.998 0 000 8.823l3.655-2.058z" fill="#FBBC05" />
                        <path d="M12 5.5c1.468 0 2.792.505 3.835 1.49l2.876-2.876C16.961 2.47 14.695 1.6 12 1.6 8.02 1.6 4.64 3.61 2.993 6.412l3.655 2.47C7.402 7.18 9.513 5.5 12 5.5z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                    <span className="bg-[#0e0e0e] px-3 text-zinc-600">Or using email</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Identity</label>
                    <input
                        type="text"
                        required
                        autoComplete="name"
                        className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-4xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                        placeholder="Full Name"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Email Address</label>
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={loading}
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
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Initializing...' : 'Create Account'}
                </button>

                <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-wider">
                    Registration indicates acceptance of our {' '}
                    <Link href="/terms-of-service" className="text-white hover:underline">
                        Legal Terms
                    </Link>
                </p>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-zinc-500">
                    Already have an account?
                    <Link href="/auth/login" className="text-white hover:underline ml-1 font-bold">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            <main className="relative z-10 pt-20 pb-12 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
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

                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full -z-10" />
                        <div className="bg-zinc-900/40 border border-white/8 backdrop-blur-3xl rounded-4xl p-8 md:p-12">
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
