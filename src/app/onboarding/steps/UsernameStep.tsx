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
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-white italic tracking-tighter">
                    Hey @{value || 'Username'} 👋
                </h2>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest italic">
                    Let's monetize your following!
                </p>
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-zinc-600 font-bold text-sm">
                        @ <span className="ml-2 text-zinc-400">creatorly.in/</span>
                    </div>
                    <input
                        type="text"
                        required
                        autoFocus
                        className={`w-full pl-36 pr-12 py-5 bg-white/3 border-2 rounded-2xl outline-none transition-all font-bold text-xl text-white placeholder-zinc-700 ${status === 'available' ? 'border-emerald-500/50 focus:border-emerald-500' :
                                status === 'taken' || status === 'invalid' ? 'border-rose-500/50 focus:border-rose-500' :
                                    'border-indigo-500/30 focus:border-indigo-500'
                            }`}
                        placeholder="username"
                        value={value}
                        onChange={(e) => validateAndChange(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                        {status === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />}
                        {status === 'available' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                        {(status === 'taken' || status === 'invalid') && <ShieldAlert className="w-5 h-5 text-rose-500" />}
                    </div>
                </div>

                {message && (
                    <p className={`text-[10px] font-black uppercase tracking-widest ml-1 ${status === 'available' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                        {message}
                    </p>
                )}

                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 text-center">
                    <p className="text-xs text-zinc-500 font-medium">Your link will be:</p>
                    <p className="text-sm text-indigo-400 font-black italic tracking-tight">
                        creatorly.in/{value || 'yourname'}
                    </p>
                </div>
            </div>

            <button
                onClick={onNext}
                disabled={status !== 'available'}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
                Next Step <Rocket size={16} />
            </button>
        </div>
    );
}
