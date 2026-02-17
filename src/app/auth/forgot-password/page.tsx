'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const router = useRouter();

    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [identifier, setIdentifier] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError('');

        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier,
            });
            setStep('verify');
        } catch (err: any) {
            console.error(err);
            setError(err.errors?.[0]?.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError('');

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                setSuccess(true);
                setTimeout(() => router.push('/dashboard'), 2000);
            } else {
                console.log(result);
                setError('Verification incomplete. Please try again.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.errors?.[0]?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans antialiased flex items-center justify-center px-6">
                <div className="bg-zinc-900/40 border border-green-500/20 rounded-4xl p-12 text-center shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                    <p className="text-zinc-500">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <Link href="/auth/login" className="inline-flex items-center text-xs font-bold text-zinc-600 hover:text-white uppercase tracking-widest mb-8 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Login
                    </Link>

                    <div className="bg-zinc-900/40 border border-white/8 backdrop-blur-3xl rounded-4xl p-8 md:p-12 shadow-2xl">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-medium tracking-tight text-white mb-2">
                                {step === 'request' ? 'Reset Password' : 'Verify & Set Password'}
                            </h1>
                            <p className="text-zinc-500 text-sm">
                                {step === 'request'
                                    ? "Enter your email to receive a reset code."
                                    : `Enter the code sent to ${identifier}`
                                }
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-500/20 mb-6 animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {step === 'request' ? (
                            <form onSubmit={handleRequestReset} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                                        placeholder="user@example.com"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                >
                                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyReset} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-indigo-500/50 focus:bg-zinc-900 text-center text-2xl tracking-[0.5em] font-mono text-white placeholder-zinc-700"
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl focus:border-indigo-500/50 focus:bg-white/5 outline-none transition-all font-medium text-white placeholder-zinc-600"
                                        placeholder="New secure password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        minLength={8}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('request')}
                                    className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    Use different email
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
