'use client';

import React from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { Check } from 'lucide-react';

const STEPS = [
    { id: 'cart', label: 'Cart' },
    { id: 'customer', label: 'Details' },
    { id: 'review', label: 'Review' }
];

export default function CheckoutStepper() {
    const { step, setStep } = useCheckoutStore();
    const currentIdx = STEPS.findIndex(s => s.id === step);

    return (
        <div className="w-full py-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto relative px-4">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0 mx-8" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0 mx-8 transition-all duration-500"
                    style={{ width: `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
                />

                {STEPS.map((s, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;

                    return (
                        <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                            <button
                                onClick={() => idx < currentIdx && setStep(s.id as any)}
                                disabled={idx > currentIdx}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${isCompleted
                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                    : isActive
                                        ? 'bg-black border-indigo-500 text-indigo-500'
                                        : 'bg-black border-white/10 text-zinc-600'
                                    }`}
                            >
                                {isCompleted ? <Check size={14} /> : <span className="text-xs font-black">{idx + 1}</span>}
                            </button>
                            <span className={`text-[9px] uppercase font-black tracking-widest ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
