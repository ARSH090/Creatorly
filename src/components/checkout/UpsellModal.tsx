'use client';

import React, { useState } from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { Loader2, Sparkles, X, Check, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function UpsellModal() {
    const { upsellOffer, customer, setStep, setUpsellOffer } = useCheckoutStore();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!upsellOffer) {
        setStep('review');
        return null;
    }

    const handleDecline = () => {
        setUpsellOffer(null);
        setStep('review');
    };

    const handleAccept = async () => {
        setIsProcessing(true);
        try {
            // Create a specialized order for the upsell
            // We reuse create-order but pass a custom cart item
            // Note: In real world, we'd want to just "capture" if possible, but creating new order is safer

            const cartItem = {
                id: upsellOffer.id,
                name: upsellOffer.name,
                price: upsellOffer.offerPrice, // Use discounted price
                quantity: 1,
                image: upsellOffer.image,
                type: 'upsell'
            };

            const response = await fetch('/api/payments/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart: [cartItem],
                    customer // Use same customer info
                })
            });

            const order = await response.json();
            if (order.error) throw new Error(order.error);

            // Open Razorpay for Upsell
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Creatorly Special Offer',
                description: `One-time offer: ${upsellOffer.name}`,
                image: '/logo.png',
                order_id: order.id,
                handler: function (response: any) {
                    // Success!
                    console.log('[Upsell] Payment success:', response);
                    setUpsellOffer(null);
                    setStep('review');
                },
                prefill: {
                    name: customer.name,
                    email: customer.email,
                    contact: customer.phone,
                },
                theme: { color: '#ec4899' } // Pink for upsell
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Upsell error', error);
            alert('Something went wrong with the offer. Taking you to receipt.');
            setStep('review');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-20"></div>
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-300 animate-pulse" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Wait! One Last thing...</h2>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Exclusive One-Time Offer</p>

                    <button
                        onClick={handleDecline}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex gap-4">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10">
                            <Image src={upsellOffer.image} alt={upsellOffer.name} fill className="object-cover" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg leading-tight text-white">{upsellOffer.name}</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black italic text-emerald-400">₹{upsellOffer.offerPrice}</span>
                                <span className="text-sm text-zinc-500 line-through decoration-red-500">₹{upsellOffer.originalPrice}</span>
                            </div>
                            <div className="inline-flex px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                Save 30% Today
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/[0.03] p-4 rounded-xl text-zinc-400 text-sm leading-relaxed">
                        <p>{upsellOffer.description || "Get this exclusive add-on to complete your purchase. This offer is only available right now."}</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleAccept}
                            disabled={isProcessing}
                            className="w-full py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : <ShoppingBag size={16} />}
                            Yes, Add to My Order
                        </button>
                        <button
                            onClick={handleDecline}
                            className="w-full py-3 text-zinc-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                            No thanks, I'll pass
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
