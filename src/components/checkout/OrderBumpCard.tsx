'use client';

import React from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { Check } from 'lucide-react';
import Image from 'next/image';

interface OrderBumpCardProps {
    bump: {
        id: string;
        bumpProductId: string;
        headline: string;
        description: string;
        productImage: string;
        originalPrice: number;
        discountedPrice: number;
        currency: string;
    };
}

export default function OrderBumpCard({ bump }: OrderBumpCardProps) {
    const { orderBumpAccepted, setOrderBump } = useCheckoutStore();

    return (
        <div className={`border-2 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden ${orderBumpAccepted
            ? 'border-amber-400 bg-amber-50/10'
            : 'border-white/10 bg-white/[0.03] hover:border-amber-400/50'
            }`}>
            {/* Attention Grabber */}
            <div className="absolute top-0 right-0 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                One-Time Offer
            </div>

            <div className="flex gap-4 items-start pt-2">
                <div className="flex-shrink-0 pt-1">
                    <button
                        onClick={() => setOrderBump(!orderBumpAccepted)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${orderBumpAccepted
                            ? 'bg-amber-400 border-amber-400 text-black'
                            : 'border-white/20 hover:border-amber-400/50'
                            }`}
                    >
                        {orderBumpAccepted && <Check size={14} strokeWidth={4} />}
                    </button>
                </div>

                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-black relative">
                    <Image
                        src={bump.productImage}
                        alt={bump.headline}
                        fill
                        sizes="80px"
                        className="object-cover"
                    />
                </div>

                <div className="flex-1 space-y-1">
                    <h4 className="font-black uppercase tracking-tighter text-white text-lg leading-tight">
                        {bump.headline}
                    </h4>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 italic">
                        {bump.description}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                        <span className="text-amber-400 font-black text-xl tracking-tighter">
                            {bump.currency} {bump.discountedPrice}
                        </span>
                        <span className="text-zinc-600 line-through text-xs font-bold">
                            {bump.currency} {bump.originalPrice}
                        </span>
                    </div>
                </div>
            </div>

            {/* Animation pulse for summary update would be triggered by 'orderBumpAccepted' state in parent */}
        </div>
    );
}
