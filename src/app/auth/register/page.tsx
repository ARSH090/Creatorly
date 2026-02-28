'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Zap, Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, User } from 'lucide-react';

type Stage = 'form' | 'email-verify' | 'done';

export default function RegisterPage() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();

    const [form, setForm] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [otp, setOtp] = useState('');

    const [stage, setStage] = useState<Stage>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [usernameAvail, setUsernameAvail] = useState<boolean | null>(null);
    const [usernameChecking, setUsernameChecking] = useState(false);

    // ── Username availability check (debounced 500ms) ──────────────────────────
    const checkUsername = useCallback(async (val: string) => {
        if (val.length < 3) { setUsernameAvail(null); return; }
        setUsernameChecking(true);
        try {
            const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(val)}`);
            const d = await res.json();
            setUsernameAvail(d.available === true);
        } catch {
            setUsernameAvail(null);
        } finally {
            setUsernameChecking(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => { if (form.username) checkUsername(form.username); }, 500);
        return () => clearTimeout(t);
    }, [form.username, checkUsername]);

    // ── Step 1: Create Clerk User & Send Email Verification ────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || loading) return;
        if (usernameAvail === false) { setError('Username is taken'); return; }
        if (!/^[a-z]/.test(form.username)) { setError('Username must start with a letter'); return; }
        if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

        setLoading(true);
        setError('');

        try {
            // Create Clerk User
            const result = await signUp.create({
                emailAddress: form.email,
                password: form.password,
                username: form.username,
                firstName: form.fullName.split(' ')[0],
                lastName: form.fullName.split(' ').slice(1).join(' ') || undefined,
                unsafeMetadata: {
                    username: form.username,
                    fullName: form.fullName,
                },
            });

            if (result.status === 'complete') {
                // Email verification not required
                await setActive({ session: result.createdSessionId });
                setStage('done');
                window.location.href = '/dashboard';
            } else if (result.unverifiedFields.includes('email_address')) {
                // Send email verification code
                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                setStage('email-verify');
            } else {
                setError('Signup incomplete. Please contact support.');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify Email OTP ───────────────────────────────────────────────
    const handleVerifyEmail = async () => {
        if (!isLoaded || loading || otp.length < 6) return;
        setLoading(true);
        setError('');

        try {
            const result = await signUp.attemptEmailAddressVerification({
                code: otp,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                setStage('done');
                window.location.href = '/dashboard';
            } else {
                setError('Verification incomplete. Please try again.');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit on 6 digits
    useEffect(() => {
        if (otp.length === 6 && stage === 'email-verify') handleVerifyEmail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    const resendCode = async () => {
        try {
            await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
            setError('');
        } catch {
            setError('Failed to resend code. Please try again.');
        }
    };

    // ─── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans antialiased">
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 min-h-screen flex items-start justify-center px-4 py-10 md:py-16">
                <div className="w-full max-w-md">
                    {/* Clerk Turnstile CAPTCHA */}
                    <div id="clerk-captcha" className="absolute w-0 h-0 overflow-hidden" />

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Zap size={20} className="text-white fill-white" />
                            </div>
                            <span className="text-white font-black text-2xl tracking-tighter">Creatorly</span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            {stage === 'email-verify' ? 'Check your email' :
                                stage === 'done' ? 'Account created! 🎉' :
                                    'Create your account'}
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium">
                            {stage === 'email-verify'
                                ? `We sent a 6-digit code to ${form.email}`
                                : stage === 'done'
                                    ? 'Taking you to choose a plan…'
                                    : 'Join thousands of creators building their future.'}
                        </p>
                    </div>

                    {/* ── Email Verify Stage ───────────────────────────────────── */}
                    {stage === 'email-verify' && (
                        <div className="bg-[#0A0A0A]/80 border border-white/8 backdrop-blur-3xl rounded-[2rem] p-8 space-y-6">
                            {error && (
                                <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-medium border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <div className="text-center space-y-4">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Mail size={26} className="text-indigo-400" />
                                </div>
                                <input
                                    type="text"
                                    maxLength={6}
                                    inputMode="numeric"
                                    autoFocus
                                    placeholder="000000"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    disabled={loading}
                                    className="w-full px-5 py-5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white text-4xl font-black text-center tracking-[0.5em] placeholder-zinc-700 focus:border-indigo-500/50 transition-all disabled:opacity-50"
                                />
                            </div>

                            <button
                                onClick={handleVerifyEmail}
                                disabled={loading || otp.length < 6}
                                className="w-full py-4 bg-white text-black hover:bg-zinc-100 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : 'Verify & Continue'}
                            </button>

                            <button
                                onClick={resendCode}
                                disabled={loading}
                                className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                Didn&apos;t receive it? <span className="underline">Resend Code</span>
                            </button>
                        </div>
                    )}

                    {/* ── Done Stage ────────────────────────────────────────────── */}
                    {stage === 'done' && (
                        <div className="bg-[#0A0A0A]/80 border border-white/8 backdrop-blur-3xl rounded-[2rem] p-12 text-center space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 size={30} className="text-emerald-400" />
                            </div>
                            <p className="text-white font-black text-xl">Email verified!</p>
                            <p className="text-zinc-500 text-sm">Setting up your account…</p>
                            <Loader2 size={20} className="animate-spin text-zinc-600 mx-auto" />
                        </div>
                    )}

                    {/* ── Form Stage ────────────────────────────────────────────── */}
                    {stage === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-[#0A0A0A]/80 border border-white/8 backdrop-blur-3xl rounded-[2rem] p-8 space-y-5">

                                {error && (
                                    <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-medium border border-red-500/20">
                                        {error}
                                    </div>
                                )}

                                {/* Username */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Username</label>
                                    <div className="relative flex items-center bg-white/3 border border-white/8 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 focus-within:bg-white/5 transition-all">
                                        <span className="flex-shrink-0 pl-4 pr-2 text-zinc-500 text-sm font-semibold select-none whitespace-nowrap border-r border-white/8 py-3.5">
                                            creatorly.in/
                                        </span>
                                        <input
                                            type="text"
                                            required
                                            placeholder="yourcoolname"
                                            value={form.username}
                                            onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                                            className="flex-1 min-w-0 px-3 py-3.5 bg-transparent outline-none text-white placeholder-zinc-600 text-sm font-medium"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs flex items-center gap-1">
                                            {usernameChecking && <Loader2 size={14} className="animate-spin text-zinc-600" />}
                                            {!usernameChecking && usernameAvail === true && (
                                                <>
                                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                                    <span className="text-emerald-400 text-[10px] font-black uppercase">Available</span>
                                                </>
                                            )}
                                            {!usernameChecking && usernameAvail === false && (
                                                <span className="text-red-400 text-[10px] font-black uppercase">Username taken</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Full Name</label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Jane Creator"
                                            value={form.fullName}
                                            onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                                            className="w-full pl-10 py-3.5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:bg-white/5 transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Email Address</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                            className="w-full pl-10 py-3.5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:bg-white/5 transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Password</label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            placeholder="Min. 8 characters"
                                            value={form.password}
                                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                            className="w-full pl-10 pr-12 py-3.5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:bg-white/5 transition-all text-sm font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(p => !p)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                                        >
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Live URL preview */}
                                {form.username && (
                                    <div className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-4 py-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                                        <span className="text-zinc-600 text-xs font-mono">creatorly.in/</span>
                                        <span className="text-white text-xs font-mono font-bold">{form.username}</span>
                                        <span className="ml-auto text-zinc-700 text-[10px] font-black uppercase tracking-widest">Your Link</span>
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !isLoaded || usernameAvail === false}
                                className="w-full py-5 bg-white text-black hover:bg-zinc-100 rounded-2xl font-black text-base uppercase tracking-tight transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
                            >
                                {loading
                                    ? <><Loader2 size={18} className="animate-spin" /> Creating Account…</>
                                    : <><ArrowRight size={18} /> Create Account</>
                                }
                            </button>

                            <p className="text-center text-xs text-zinc-600">
                                Already have an account?{' '}
                                <Link href="/auth/login" className="text-zinc-400 hover:text-white font-bold transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
