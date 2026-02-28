'use client';

import React, { useState } from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { ShieldCheck, ArrowRight, ChevronLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import Image from 'next/image';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function OrderReview() {
    const { cart, customer, setStep, clearCart } = useCheckoutStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleCompletePurchase = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // 1. Load Razorpay Script
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                throw new Error('Razorpay SDK failed to load. Please check your connection.');
            }

            // 2. Create Order on Backend
            const response = await fetch('/api/payments/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart, customer })
            });

            const order = await response.json();
            if (order.error) throw new Error(order.error);

            // 3. Open Razorpay Modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Creatorly',
                description: `Purchase from ${cart[0]?.creator || 'Creatorly'}`,
                image: '/logo.png',
                order_id: order.id,
                handler: function (response: any) {
                    console.log('[Razorpay] Payment Success:', response);
                    clearCart();
                    const username = cart[0]?.creator || 'default';
                    // We can't easily get the Order._id here without an additional API check, 
                    // but we can pass the RAZORPAY_ORDER_ID to the success page which can then look up the Order._id
                    window.location.href = `/u/${username}/success/${order.id}`;
                },
                prefill: {
                    name: customer.name,
                    email: customer.email,
                    contact: customer.phone,
                },
                theme: {
                    color: '#6366f1',
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                setError(`Payment Failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            rzp.open();

        } catch (err: any) {
            console.error('[Checkout Error]:', err);
            setError(err.message || 'Payment initialization failed. Please try again.');
            setIsProcessing(false);
        }
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

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-bold uppercase tracking-widest">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

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
