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
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white italic tracking-tight">
                    Personal Details 👤
                </h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    Tell us a bit about yourself
                </p>
            </div>

            <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">Full Name</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-zinc-600">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            className={`w-full pl-12 pr-5 py-4 bg-white/3 border-2 rounded-2xl outline-none transition-all font-bold text-white placeholder-zinc-700 ${errors.fullName ? 'border-rose-500/50' : 'border-white/5 focus:border-indigo-500/50'
                                }`}
                            placeholder="John Doe"
                            value={data.fullName}
                            onChange={(e) => onChange({ fullName: e.target.value })}
                        />
                    </div>
                    {errors.fullName && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-zinc-600">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            disabled={data.isGoogle}
                            className={`w-full pl-12 pr-5 py-4 bg-white/3 border-2 rounded-2xl outline-none transition-all font-bold text-white placeholder-zinc-700 ${data.isGoogle ? 'opacity-50 cursor-not-allowed grayscale' : ''
                                } ${errors.email ? 'border-rose-500/50' : 'border-white/5 focus:border-indigo-500/50'}`}
                            placeholder="john@example.com"
                            value={data.email}
                            onChange={(e) => onChange({ email: e.target.value })}
                        />
                    </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">Indian Mobile (+91)</label>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-4 bg-white/3 border border-white/8 rounded-2xl text-zinc-400 font-black text-xs">
                            <span>🇮🇳</span>
                            <span>+91</span>
                        </div>
                        <div className="relative flex-1 group">
                            <input
                                type="tel"
                                maxLength={10}
                                className={`w-full px-5 py-4 bg-white/3 border-2 rounded-2xl outline-none transition-all font-bold text-white placeholder-zinc-700 ${errors.phone ? 'border-rose-500/50' : 'border-white/5 focus:border-indigo-500/50'
                                    }`}
                                placeholder="9876543210"
                                value={data.phone}
                                onChange={(e) => onChange({ phone: e.target.value.replace(/\D/g, '') })}
                            />
                        </div>
                    </div>
                    {errors.phone && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.phone}</p>}
                </div>

                {/* Password (if not Google) */}
                {!data.isGoogle && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">Create Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-zinc-600">
                                <Shield size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`w-full pl-12 pr-14 py-4 bg-white/3 border-2 rounded-2xl outline-none transition-all font-bold text-white placeholder-zinc-700 ${errors.password ? 'border-rose-500/50' : 'border-white/5 focus:border-indigo-500/50'
                                    }`}
                                placeholder="••••••••"
                                value={data.password}
                                onChange={(e) => onChange({ password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-5 text-zinc-600 hover:text-indigo-400"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.password}</p>}
                    </div>
                )}
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 bg-white/5 text-zinc-400 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button
                    onClick={handleNext}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                    Verify Phone <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
