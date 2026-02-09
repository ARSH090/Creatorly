'use client';

import React, { useState } from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function RazorpayCheckout() {
    const { cart, customer, setStep } = useCheckoutStore();
    const [isInitializing, setIsInitializing] = useState(false);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalWithTax = subtotal * 1.18;

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setIsInitializing(true);

        try {
            // 1. Load Razorpay Script
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                alert('Razorpay SDK failed to load. Are you online?');
                return;
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
                description: `Payment for ${cart.length} item(s)`,
                image: '/logo.png', // Replace with your logo
                order_id: order.id,
                handler: function (response: any) {
                    // Logic after successful payment
                    console.log('[Razorpay] Payment success:', response);
                    setStep('review');
                },
                prefill: {
                    name: customer.name,
                    email: customer.email,
                    contact: customer.phone,
                },
                theme: {
                    color: '#6366f1', // Indigo 500
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert(`Payment failed: ${response.error.description}`);
            });
            rzp.open();

        } catch (error: any) {
            console.error('[Razorpay] Init error:', error);
            alert('Could not initialize payment. Please try again.');
        } finally {
            setIsInitializing(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Select Payment</h3>
                <p className="text-zinc-500 text-sm">Safe & Encrypted transactions via Razorpay</p>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} className="text-indigo-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Total Payable</span>
                    </div>
                    <span className="text-3xl font-black italic tracking-tighter text-white">
                        ₹{totalWithTax.toLocaleString()}
                    </span>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handlePayment}
                        disabled={isInitializing}
                        className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-[0_15px_30px_rgba(99,102,241,0.3)]"
                    >
                        {isInitializing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Initializing...
                            </>
                        ) : (
                            'Pay with Razorpay'
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><ShieldCheck size={12} /> UPI Support</span>
                        <span>•</span>
                        <span>Credit/Debit Cards</span>
                        <span>•</span>
                        <span>Netbanking</span>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setStep('customer')}
                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
            >
                Back to Details
            </button>
        </div>
    );
}
