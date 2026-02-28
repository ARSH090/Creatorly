'use client';

import React from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import CheckoutStepper from '@/components/checkout/CheckoutStepper';
import CartSummary from '@/components/checkout/CartSummary';
import CustomerInfoForm from '@/components/checkout/CustomerInfoForm';
import OrderReview from '@/components/checkout/OrderReview';
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';
import { Sparkles } from 'lucide-react';

import UpsellModal from '@/components/checkout/UpsellModal';

export default function CheckoutPage() {
    const { step } = useCheckoutStore();

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30 pb-20">
            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <Sparkles size={16} className="text-white fill-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tighter italic">Creatorly Checkout</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white flex items-center justify-center gap-4">
                        SECURE CHECKOUT
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Powered by Razorpay & Anti-Gravity Tech</p>
                </div>

                <CheckoutStepper />

                <div className="mt-16">
                    {step === 'cart' && <CartSummary />}
                    {step === 'customer' && <CustomerInfoForm />}
                    {step === 'review' && <OrderReview />}
                    {step === 'upsell' && <UpsellModal />}
                </div>
            </main>
        </div>
    );
}
