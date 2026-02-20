'use client';

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
                    <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                    <Link href="/" className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 lg:pb-0">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Shop
                    </Link>
                    <p className="font-bold text-gray-900">Secure Checkout</p>
                    <div className="w-24" /> {/* Spacer */}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 lg:py-12">
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({cartItems.length})</h1>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            {cartItems.map((item) => (
                                <div key={item.cartItemId} className="p-4 sm:p-6 flex gap-4 sm:gap-6 group">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
                                                <p className="font-bold text-gray-900 shrink-0">₹{item.price}</p>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">
                                                by {item.creator} {item.variantTitle && `• ${item.variantTitle}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <button
                                                onClick={() => removeItem(item.cartItemId)}
                                                className="text-gray-400 hover:text-red-500 text-sm font-medium flex items-center gap-1 transition-colors"
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
                                <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                        <badge.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{badge.title}</p>
                                        <p className="text-xs text-gray-500">{badge.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary - Right Rail / Bottom Sheet on Mobile */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 lg:p-0 lg:static lg:bg-transparent lg:border-none lg:block z-40">
                        <div className="max-w-md mx-auto lg:max-w-none">
                            <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 hidden lg:block">Order Summary</h2>

                                <div className="space-y-4 mb-6 hidden lg:block">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600 font-medium">
                                            <span>Discount</span>
                                            <span>-₹{discount}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-gray-100" />
                                    <div className="flex justify-between text-xl font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>₹{total}</span>
                                    </div>
                                </div>

                                <div className="mb-6 hidden lg:block">
                                    <button
                                        onClick={() => setIsCouponModalOpen(true)}
                                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold text-sm hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all"
                                    >
                                        Have a promo code?
                                    </button>
                                </div>

                                {/* Mobile Summary - Collapsed */}
                                <div className="flex lg:hidden justify-between items-center mb-4 text-sm font-medium text-gray-600">
                                    <span>Total ({cartItems.length} items)</span>
                                    <span className="font-bold text-gray-900 text-lg">₹{total}</span>
                                </div>

                                <Link href="/checkout" className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-black/20">
                                    <span>To Checkout</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed hidden lg:block">
                                    By placing this order you agree to our Terms of Service and Privacy Policy.
                                </p>
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
