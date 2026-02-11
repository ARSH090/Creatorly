'use client';

import React, { useEffect } from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { Mail, User, Phone, ArrowRight, ChevronLeft } from 'lucide-react';

export default function CustomerInfoForm() {
    const { customer, setCustomer, setStep } = useCheckoutStore();

    // Auto-save logic is handled by Zustand middleware, but we can add secondary persistence here if needed.

    return (
        <div className="max-w-xl mx-auto space-y-12">
            <div className="text-center">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Your Details</h3>
                <p className="text-zinc-500 mt-2 text-sm">Where should we deliver your products?</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-4 mb-1 block">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="text"
                                placeholder="Elon Musk"
                                value={customer.name}
                                onChange={(e) => setCustomer({ name: e.target.value })}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-4 mb-1 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="email"
                                placeholder="elon@x.com"
                                value={customer.email}
                                onChange={(e) => setCustomer({ email: e.target.value })}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-4 mb-1 block">Phone Number (Optional)</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={customer.phone}
                                onChange={(e) => setCustomer({ phone: e.target.value })}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={() => setStep('cart')}
                        className="py-4 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                    >
                        <ChevronLeft size={14} /> Back to Cart
                    </button>
                    <button
                        onClick={() => setStep('review')}
                        disabled={!customer.name || !customer.email}
                        className="py-4 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                    >
                        Continue <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
