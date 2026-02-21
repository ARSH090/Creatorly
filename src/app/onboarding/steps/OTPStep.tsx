'use client';

import { useState, useEffect, useRef } from 'react';
import { Smartphone, ShieldCheck, Timer, RefreshCw, ArrowLeft } from 'lucide-react';

interface OTPStepProps {
    phone: string;
    onVerified: (hash: string) => void;
    onBack: () => void;
}

export default function OTPStep({ phone, onVerified, onBack }: OTPStepProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const inputs = useRef<HTMLInputElement[]>([]);

    useEffect(() => {
        // Initial OTP send
        sendOTP();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const sendOTP = async () => {
        setError('');
        setLoading(true);
        try {
            const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
            const res = await fetch('/api/onboarding/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
            setCountdown(30);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (code: string) => {
        setError('');
        setLoading(true);
        try {
            const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
            const res = await fetch('/api/onboarding/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone, otp: code })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid code');
            onVerified(data.phoneHash);
        } catch (err: any) {
            setError(err.message);
            setOtp(['', '', '', '', '', '']);
            inputs.current[0].focus();
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputs.current[index + 1].focus();
        }

        if (newOtp.every(digit => digit !== '')) {
            verifyOTP(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const maskedPhone = `+91 XXXXXX${phone.slice(-4)}`;

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-4 ring-4 ring-indigo-500/5">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tight underline decoration-indigo-500 decoration-4 underline-offset-8">
                    Verify Mobile
                </h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest pt-4">
                    Code sent to <span className="text-white">{maskedPhone}</span>
                </p>
            </div>

            <div className="space-y-6">
                <div className="flex justify-center gap-3">
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { if (el) inputs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className={`w-12 h-16 bg-white/3 border-2 rounded-xl text-center text-2xl font-black text-white outline-none transition-all ${digit ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5 focus:border-indigo-500/30'
                                } ${error ? 'border-rose-500/50' : ''}`}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            disabled={loading}
                        />
                    ))}
                </div>

                {error && <p className="text-[10px] text-rose-500 font-bold text-center uppercase tracking-widest animate-pulse">✗ {error}</p>}
                {loading && <p className="text-[10px] text-indigo-400 font-bold text-center uppercase tracking-widest animate-pulse">Verifying code...</p>}

                <div className="text-center">
                    {countdown > 0 ? (
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <Timer size={12} /> Resend in {countdown}s
                        </p>
                    ) : (
                        <button
                            onClick={sendOTP}
                            disabled={loading}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto"
                        >
                            <RefreshCw size={12} /> Resend OTP
                        </button>
                    )}
                </div>
            </div>

            <button
                onClick={onBack}
                className="w-full py-4 text-zinc-500 hover:text-zinc-300 font-black text-xs uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
            >
                <ArrowLeft size={16} /> Back to details
            </button>
        </div>
    );
}
