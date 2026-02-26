'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';

interface OTPStepProps {
    onNext: () => void;
    onBack: () => void;
}

export default function OTPStep({ onNext, onBack }: OTPStepProps) {
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress || '';

    useEffect(() => {
        if (timer > 0) {
            const t = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [timer]);

    const handleSendCode = async () => {
        if (!user || !email) return;
        try {
            // Prepare email verification via Clerk
            const emailObj = user.primaryEmailAddress;
            if (emailObj) {
                await emailObj.prepareVerification({ strategy: 'email_code' });
                setTimer(60);
                toast.success('Verification code sent to your email');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to send code');
        }
    };

    const handleVerify = async () => {
        if (otp.length < 6 || !user) return;
        setLoading(true);
        try {
            // Verify email via Clerk
            const emailAddress = user.primaryEmailAddress;
            if (emailAddress) {
                await emailAddress.attemptVerification({ code: otp });
                toast.success('Email verified!');
                onNext();
            }
        } catch (error: any) {
            toast.error(error.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit on 6 digits
    useEffect(() => {
        if (otp.length === 6) {
            handleVerify();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    // Initial send
    useEffect(() => {
        if (email && timer === 0) {
            handleSendCode();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 ring-4 ring-indigo-50">
                    <Mail size={32} />
                </div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
                    Verify Your Email
                </h2>
                <p className="text-zinc-500 text-base font-medium">
                    We&apos;ve sent a 6-digit code to <br />
                    <span className="text-indigo-600 font-bold">{email}</span>
                </p>
            </div>

            <div className="space-y-6">
                <div className="relative">
                    <input
                        type="text"
                        maxLength={6}
                        className="w-full px-5 py-5 bg-white border-2 border-zinc-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 rounded-[2rem] outline-none transition-all font-bold text-4xl text-center tracking-[0.5em] text-zinc-900 placeholder-zinc-100"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        disabled={loading}
                    />
                </div>

                <div className="flex justify-between items-center px-4">
                    <button
                        onClick={handleSendCode}
                        disabled={timer > 0 || loading}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:text-zinc-300 transition-colors"
                    >
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        <ShieldCheck size={14} />
                        Secured by Clerk
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <button
                    onClick={handleVerify}
                    disabled={loading || otp.length < 6}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        'Verify'
                    )}
                </button>

                <button
                    onClick={onBack}
                    className="w-full py-4 text-zinc-400 hover:text-zinc-600 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                    Go back
                </button>
            </div>
        </div>
    );
}
