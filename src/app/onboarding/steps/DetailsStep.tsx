'use client';

import { useState } from 'react';
import { User, Mail, Smartphone, Shield, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface DetailsStepProps {
    data: any;
    onChange: (updates: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function DetailsStep({ data, onChange, onNext, onBack }: DetailsStepProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!data.fullName.trim()) newErrors.fullName = 'Name is required';
        if (!data.email.includes('@')) newErrors.email = 'Invalid email';
        if (!/^[6-9]\d{9}$/.test(data.phone)) newErrors.phone = '10-digit Indian number required';
        if (!data.isGoogle && data.password.length < 8) newErrors.password = 'Min 8 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) onNext();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
                    Personal Details 👤
                </h2>
                <p className="text-zinc-500 text-base font-medium">
                    Tell us a bit about yourself
                </p>
            </div>

            <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                    <div className={`relative group flex items-center px-4 py-4 bg-white border-2 rounded-2xl transition-all ${errors.fullName ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-zinc-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10'
                        }`}>
                        <User className="text-zinc-400 mr-3" size={18} />
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none font-bold text-zinc-900 placeholder-zinc-300"
                            placeholder="Full Name"
                            value={data.fullName}
                            onChange={(e) => onChange({ fullName: e.target.value })}
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <div className={`relative group flex items-center px-4 py-4 bg-white border-2 rounded-2xl transition-all ${data.isGoogle ? 'bg-zinc-50' : ''
                        } ${errors.email ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-zinc-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10'}`}>
                        <Mail className="text-zinc-400 mr-3" size={18} />
                        <input
                            type="email"
                            disabled={data.isGoogle}
                            className="flex-1 bg-transparent border-none outline-none font-bold text-zinc-900 placeholder-zinc-300 disabled:text-zinc-500"
                            placeholder="Email"
                            value={data.email}
                            onChange={(e) => onChange({ email: e.target.value })}
                        />
                    </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                    <div className={`relative group flex items-center px-4 py-4 bg-white border-2 rounded-2xl transition-all ${errors.phone ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-zinc-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10'
                        }`}>
                        <div className="flex items-center gap-1.5 text-zinc-600 font-bold mr-3 pr-3 border-r border-zinc-200">
                            <span>🇮🇳</span>
                            <span>+91</span>
                        </div>
                        <input
                            type="tel"
                            maxLength={10}
                            className="flex-1 bg-transparent border-none outline-none font-bold text-zinc-900 placeholder-zinc-300"
                            placeholder="Phone Number"
                            value={data.phone}
                            onChange={(e) => onChange({ phone: e.target.value.replace(/\D/g, '') })}
                        />
                    </div>
                </div>

                {/* Password (if not Google) */}
                {!data.isGoogle && (
                    <div className="space-y-1.5">
                        <div className={`relative group flex items-center px-4 py-4 bg-white border-2 rounded-2xl transition-all ${errors.password ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-zinc-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10'
                            }`}>
                            <Shield className="text-zinc-400 mr-3" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="flex-1 bg-transparent border-none outline-none font-bold text-zinc-900 placeholder-zinc-300"
                                placeholder="Password"
                                value={data.password}
                                onChange={(e) => onChange({ password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="ml-2 text-zinc-400 hover:text-indigo-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4">
                <button
                    onClick={handleNext}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Next
                </button>
            </div>

            <div className="text-center space-y-4">
                <p className="text-xs text-zinc-400">
                    By continuing, you agree to our <br />
                    <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Privacy Policy</span>.
                </p>
                <p className="text-zinc-400 text-sm">
                    Have an account? <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Login</span>
                </p>
            </div>
        </div>
    );
}
