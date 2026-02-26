'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, ShieldAlert, Loader2, Rocket } from 'lucide-react';

interface UsernameStepProps {
    value: string;
    onChange: (val: string) => void;
    onNext: () => void;
}

export default function UsernameStep({ value, onChange, onNext }: UsernameStepProps) {
    const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!value) {
            setStatus('idle');
            setMessage('');
            return;
        }

        if (value.length < 3) {
            setStatus('invalid');
            setMessage('At least 3 characters');
            return;
        }

        const checkAvailability = async () => {
            setStatus('checking');
            try {
                const res = await fetch(`/api/auth/check-username?username=${value}`);
                const data = await res.json();
                if (data.available) {
                    setStatus('available');
                    setMessage('Available');
                } else {
                    setStatus('taken');
                    setMessage(data.error || 'Already taken');
                }
            } catch (err) {
                setStatus('idle');
            }
        };

        const timer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timer);
    }, [value]);

    const reservedWords = ['admin', 'api', 'www', 'support', 'billing', 'dashboard', 'creatorly'];

    const validateAndChange = (val: string) => {
        const sanitized = val.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (reservedWords.includes(sanitized)) {
            setStatus('invalid');
            setMessage('That name is reserved');
        }
        onChange(sanitized);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
                    Hey @{value || 'Username'} 👋
                </h2>
                <p className="text-zinc-500 text-base font-medium">
                    Let's monetize your following!
                </p>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <div className={`flex items-center w-full px-4 py-5 bg-white border-2 rounded-2xl transition-all duration-200 ${status === 'available' ? 'border-emerald-500 ring-4 ring-emerald-500/10' :
                            status === 'taken' || status === 'invalid' ? 'border-rose-500 ring-4 ring-rose-500/10' :
                                'border-zinc-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10'
                        }`}>
                        <div className="flex items-center text-zinc-400 font-bold text-lg pointer-events-none">
                            <span className="mr-1">@</span>
                            <span className="mr-0.5">creatorly.com/</span>
                        </div>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="flex-1 bg-transparent border-none outline-none font-bold text-lg text-zinc-900 placeholder-zinc-300 ml-0.5"
                            placeholder="username"
                            value={value}
                            onChange={(e) => validateAndChange(e.target.value)}
                        />
                        <div className="ml-2">
                            {status === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />}
                            {status === 'available' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            {(status === 'taken' || status === 'invalid') && <ShieldAlert className="w-5 h-5 text-rose-500" />}
                        </div>
                    </div>
                </div>

                {message && (
                    <p className={`text-[10px] font-black uppercase tracking-widest ml-1 ${status === 'available' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                        {message}
                    </p>
                )}
            </div>

            <button
                onClick={onNext}
                disabled={status !== 'available'}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                Next Step
            </button>

            <p className="text-center text-zinc-400 text-sm">
                Already have an account? <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Login</span>
            </p>
        </div>
    );
}
