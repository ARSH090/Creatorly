'use client';
import Image from 'next/image';

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, ShoppingBag, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import CouponModal from '@/components/checkout/CouponModal';
import { motion } from 'framer-motion';

import { useCheckoutStore } from '@/lib/store/useCheckoutStore';

export default function CartPage() {
    const { cart: cartItems, removeFromCart: removeItem, setStep } = useCheckoutStore();
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [discount, setDiscount] = useState(0);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal - discount;

    const handleApplyCoupon = async (code: string) => {
        // Real coupon logic would fetch from /api/coupons/validate
        if (code === 'FIRST10') {
            setDiscount(subtotal * 0.1);
            return true;
        }
        return false;
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                        <ShoppingBag className="w-10 h-10 text-zinc-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Your cart is empty</h1>
                    <p className="text-zinc-500 mb-8">Looks like you haven't added anything yet.</p>
                    <Link href="/" className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pb-32 lg:pb-0 text-white">
            <header className="bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10 font-sans">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-medium text-sm lg:text-base">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Shop
                    </Link>
                    <p className="font-bold text-white tracking-widest uppercase text-xs lg:text-sm italic">Secure Checkout</p>
                    <div className="w-24" /> {/* Spacer */}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 lg:py-12">
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <h1 className="text-2xl lg:text-3xl font-black text-white mb-6 tracking-tight">Shopping Cart ({cartItems.length})</h1>

                        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                            {cartItems.map((item) => (
                                <div key={item.cartItemId} className="p-4 sm:p-6 flex gap-4 sm:gap-6 group">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                        <Image width={800} height={800} src={item.image} alt={item.name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-white text-lg leading-tight group-hover:text-indigo-400 transition-colors">{item.name}</h3>
                                                <p className="font-bold text-white shrink-0">₹{item.price}</p>
                                            </div>
                                            <p className="text-sm text-zinc-500 font-medium tracking-tight">
                                                by <span className="text-zinc-400">{item.creator}</span> {item.variantTitle && `• ${item.variantTitle}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <button
                                                onClick={() => removeItem(item.cartItemId)}
                                                className="text-zinc-600 hover:text-red-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Trust Badges - Desktop */}
                        <div className="hidden lg:grid grid-cols-3 gap-4 mt-8">
                            {[
                                { icon: ShieldCheck, title: "100% Secure", desc: "256-bit encryption" },
                                { icon: CreditCard, title: "Payment Support", desc: "UPI, Cards, Netbanking" },
                                { icon: ShieldCheck, title: "Buyer Protection", desc: "Guaranteed delivery" }
                            ].map((badge, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                        <badge.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white tracking-tight">{badge.title}</p>
                                        <p className="text-xs text-zinc-500">{badge.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary - Right Rail / Bottom Sheet on Mobile */}
                    <div className="fixed bottom-16 left-0 right-0 lg:static z-40 lg:bottom-auto">
                        <div className="bg-zinc-950/90 backdrop-blur-xl lg:bg-transparent p-4 lg:p-0 border-t border-white/10 lg:border-none shadow-2xl lg:shadow-none">
                            <div className="max-w-md mx-auto lg:max-w-none">
                                <div className="bg-zinc-900/40 lg:bg-zinc-900/80 backdrop-blur-xl lg:rounded-2xl lg:border lg:border-white/5 lg:p-8">
                                    <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest hidden lg:block italic">Order Summary</h2>

                                    <div className="space-y-4 mb-6 hidden lg:block">
                                        <div className="flex justify-between text-zinc-400 font-medium">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-green-400 font-bold">
                                                <span>Discount</span>
                                                <span>-₹{discount}</span>
                                            </div>
                                        )}
                                        <div className="h-px bg-white/5" />
                                        <div className="flex justify-between text-2xl font-black text-white italic">
                                            <span>Total</span>
                                            <span className="text-indigo-400">₹{total}</span>
                                        </div>
                                    </div>

                                    <div className="mb-6 hidden lg:block">
                                        <button
                                            onClick={() => setIsCouponModalOpen(true)}
                                            className="w-full py-3 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 font-black text-xs uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all"
                                        >
                                            Have a promo code?
                                        </button>
                                    </div>

                                    {/* Mobile Summary - Collapsed */}
                                    <div className="flex lg:hidden justify-between items-center mb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                        <span>Total ({cartItems.length} items)</span>
                                        <span className="font-black text-white text-xl italic">₹{total}</span>
                                    </div>

                                    <Link href="/checkout" className="w-full bg-white text-black py-4 rounded-xl font-black text-lg hover:bg-zinc-200 active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-white/5 uppercase tracking-tighter">
                                        <span>To Checkout</span>
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>

                                    <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-4 leading-relaxed hidden lg:block">
                                        Secure payment powered by Razorpay.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <CouponModal
                isOpen={isCouponModalOpen}
                onClose={() => setIsCouponModalOpen(false)}
                onApply={handleApplyCoupon}
            />
        </div>
    );
}
