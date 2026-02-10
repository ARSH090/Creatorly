'use client';

import React, { useState } from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { ShieldCheck, ArrowRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function OrderReview() {
    const { cart, customer, setStep, clearCart } = useCheckoutStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const handleCompletePurchase = async () => {
        setIsProcessing(true);
        // This will be wired to Stripe/Razorpay in Prompt 8
        // For launch readiness, we ensure the PLACEHOLDER logic redirects to the RIGHT structural path
        await new Promise(resolve => setTimeout(resolve, 2000));

        const username = cart[0]?.creator || 'default';
        const orderId = 'real-verification-needed'; // This will be the actual Order._id from Razorpay webhook

        setIsProcessing(false);
        clearCart();
        window.location.href = `/u/${username}/success/${orderId}`;
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-12">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Review Order</h3>
                    <p className="text-zinc-500 mt-2 text-sm">Double check your items and information.</p>
                </div>

                <div className="space-y-8">
                    {/* Delivery Info */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Delivering to</h4>
                        <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl">
                            <p className="text-sm font-bold text-white">{customer.name}</p>
                            <p className="text-xs text-zinc-500">{customer.email}</p>
                            {customer.phone && <p className="text-xs text-zinc-500 mt-1">{customer.phone}</p>}
                        </div>
                    </div>

                    {/* Cart Items Summary */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Items ({cart.length})</h4>
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-4 items-center">
                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-white line-clamp-1">{item.name}</p>
                                        <p className="text-[10px] text-zinc-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-xs font-black italic">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Action Card */}
            <div className="space-y-8">
                <div className="bg-indigo-500 p-8 rounded-[2.5rem] text-white space-y-8 shadow-[0_20px_50px_rgba(99,102,241,0.3)]">
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} />
                        <h4 className="font-black uppercase text-xs tracking-[0.2em]">Final Total</h4>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <span className="text-indigo-200 text-xs font-bold uppercase">Incl. 18% GST</span>
                            <span className="text-4xl font-black italic tracking-tighter">₹{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCompletePurchase}
                        disabled={isProcessing}
                        className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Complete Purchase <ArrowRight size={16} />
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-2 justify-center text-indigo-200 opacity-60">
                        <ShieldCheck size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Encrypted & Secure</span>
                    </div>
                </div>

                <button
                    onClick={() => setStep('payment')}
                    disabled={isProcessing}
                    className="w-full py-4 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    <ChevronLeft size={14} /> Back to Payment
                </button>
            </div>
        </div>
    );
}
