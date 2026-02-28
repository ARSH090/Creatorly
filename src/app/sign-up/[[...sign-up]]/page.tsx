'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Zap, Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, User } from 'lucide-react';

type Stage = 'form' | 'email-verify' | 'done';

export default function SignUpPage() {
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

    // Username availability check
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || loading) return;
        if (usernameAvail === false) { setError('Username is taken'); return; }
        if (!/^[a-z]/.test(form.username)) { setError('Username must start with a letter'); return; }
        if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

        setLoading(true);
        setError('');

        try {
            const result = await signUp.create({
                emailAddress: form.email,
                password: form.password,
                username: form.username,
                firstName: form.fullName.split(' ')[0],
                lastName: form.fullName.split(' ').slice(1).join(' ') || undefined,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                setStage('done');
                window.location.href = '/subscribe';
            } else if (result.unverifiedFields.includes('email_address')) {
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
                window.location.href = '/subscribe';
            } else {
                setError('Verification incomplete. Please try again.');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (otp.length === 6 && stage === 'email-verify') handleVerifyEmail();
    }, [otp]);

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans antialiased">
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10 md:py-16">
                <div className="w-full max-w-md">
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
                    </div>

                    {stage === 'email-verify' && (
                        <div className="bg-[#0A0A0A]/80 border border-white/8 backdrop-blur-3xl rounded-[2rem] p-8 space-y-6">
                            {error && (
                                <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-medium border border-red-500/20">
                                    {error}
                                </div>
                            )}
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-5 py-5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white text-4xl font-black text-center tracking-[0.5em] placeholder-zinc-700 focus:border-indigo-500/50 transition-all"
                            />
                            <button
                                onClick={handleVerifyEmail}
                                className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
                            >
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </div>
                    )}

                    {stage === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-[#0A0A0A]/80 border border-white/8 backdrop-blur-3xl rounded-[2rem] p-8 space-y-5">
                                {error && (
                                    <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-medium border border-red-500/20">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Username</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="yourname"
                                        value={form.username}
                                        onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                                        className="w-full px-5 py-3.5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white"
                                    />
                                    {usernameAvail === false && <p className="text-red-400 text-[10px] font-black uppercase mt-1">Username taken</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Jane Doe"
                                        value={form.fullName}
                                        onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="you@email.com"
                                        value={form.email}
                                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-white/3 border border-white/8 rounded-2xl outline-none text-white"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || usernameAvail === false}
                                className="w-full py-5 bg-white text-black rounded-2xl font-black text-base uppercase tracking-tight"
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                            <p className="text-center text-xs text-zinc-600">
                                Already have an account?{' '}
                                <Link href="/sign-in" className="text-zinc-400 hover:text-white font-bold transition-colors">
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
