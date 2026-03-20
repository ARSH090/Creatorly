'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';

function clerkErrMsg(err: any, fallback: string): string {
    const clerkErr = err?.errors?.[0];
    const raw = clerkErr?.longMessage || clerkErr?.message || '';
    if (!raw) return fallback;
    if (raw[0] === raw[0].toLowerCase()) return `Code ${raw}. Please check your email and try again.`;
    return raw;
}

export default function ForgotPasswordPage() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const router = useRouter();

    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [identifier, setIdentifier] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || loading) return;
        setLoading(true);
        setError('');
        try {
            await signIn.create({ strategy: 'reset_password_email_code', identifier });
            setStep('verify');
        } catch (err: any) {
            setError(clerkErrMsg(err, 'Could not send reset code. Please check your email and try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!isLoaded || resending) return;
        setResending(true);
        setError('');
        try {
            await signIn.create({ strategy: 'reset_password_email_code', identifier });
        } catch (err: any) {
            setError(clerkErrMsg(err, 'Could not resend code. Please try again.'));
        } finally {
            setResending(false);
        }
    };

    const handleVerifyReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || loading) return;
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setLoading(true);
        setError('');
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code: code.trim(),
                password,
            });
            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                setSuccess(true);
                setTimeout(() => router.push('/dashboard'), 2000);
            } else {
                setError('Verification incomplete. Please try again or request a new code.');
            }
        } catch (err: any) {
            setError(clerkErrMsg(err, 'Could not reset password. Please check your code and try again.'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center px-6">
                <div className="bg-zinc-900/40 border border-green-500/20 rounded-3xl p-12 text-center max-w-md w-full">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                        <CheckCircle2 size={30} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Password reset!</h2>
                    <p className="text-zinc-500 text-sm">Redirecting you to the dashboard…</p>
                    <Loader2 size={18} className="animate-spin text-zinc-600 mx-auto mt-6" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans antialiased">
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <Link href="/auth/login" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-300 text-sm transition-colors mb-8">
                        <ArrowLeft size={14} />
                        Back to login
                    </Link>

                    <div className="bg-[#0A0A0A]/80 border border-white/8 backdrop-blur-3xl rounded-[2rem] p-8 md:p-10 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                                {step === 'request' ? <Mail size={22} className="text-indigo-400" /> : <Lock size={22} className="text-indigo-400" />}
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                {step === 'request' ? 'Reset your password' : 'Verify & set password'}
                            </h1>
                            <p className="text-zinc-500 text-sm mt-2">
                                {step === 'request'
                                    ? "Enter your email and we'll send you a 6-digit code."
                                    : `We sent a code to ${identifier}. Enter it below.`}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-medium border border-red-500/20 mb-6 leading-relaxed">
                                {error}
                            </div>
                        )}

                        {step === 'request' && (
                            <form onSubmit={handleRequestReset} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Email address</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                        <input
                                            type="email"
                                            required
                                            autoFocus
                                            placeholder="you@example.com"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            disabled={loading}
                                            className="w-full pl-10 py-4 bg-white/3 border border-white/8 rounded-2xl text-white outline-none placeholder-zinc-600 focus:border-indigo-500/50 focus:bg-white/5 transition-all text-sm disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !isLoaded}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : 'Send reset code'}
                                </button>
                            </form>
                        )}

                        {step === 'verify' && (
                            <form onSubmit={handleVerifyReset} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">6-digit code</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        maxLength={6}
                                        inputMode="numeric"
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        disabled={loading}
                                        className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl text-white text-2xl font-black text-center tracking-[0.5em] outline-none placeholder-zinc-700 focus:border-indigo-500/50 transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">New password</label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            placeholder="Min. 8 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                            className="w-full pl-10 pr-14 py-4 bg-white/3 border border-white/8 rounded-2xl text-white outline-none placeholder-zinc-600 focus:border-indigo-500/50 focus:bg-white/5 transition-all text-sm disabled:opacity-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(p => !p)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors text-xs font-bold"
                                        >
                                            {showPass ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !isLoaded || code.length < 6}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <><Loader2 size={15} className="animate-spin" /> Resetting…</> : 'Reset password'}
                                </button>

                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('request'); setCode(''); setError(''); }}
                                        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
                                    >
                                        <ArrowLeft size={12} /> Wrong email?
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendCode}
                                        disabled={resending}
                                        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {resending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                        Resend code
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
