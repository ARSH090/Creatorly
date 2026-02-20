'use client';

import React, { useState } from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import Image from 'next/image';
import { Trash2, Plus, Minus, ArrowRight, Tag, X, CheckCircle2, Zap, Loader2 } from 'lucide-react';

export default function CartSummary() {
    const {
        cart, removeFromCart, updateQuantity, setStep,
        coupon, setCoupon, orderBumpAccepted, setOrderBump
    } = useCheckoutStore();

    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const orderBumpPrice = cart.length > 0 ? Math.round(subtotal * 0.3) : 0;
    const discountAmount = coupon?.discountAmount || 0;
    const total = Math.max(0, subtotal + tax - discountAmount + (orderBumpAccepted ? orderBumpPrice : 0));

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await fetch('/api/payments/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, amount: subtotal })
            });
            const data = await res.json();
            if (data.success) {
                setCoupon(data.data);
                setCouponCode('');
            } else {
                setCouponError(data.error || 'Invalid coupon');
            }
        } catch {
            setCouponError('Failed to validate coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="text-center py-20 space-y-6">
                <div className="text-6xl">🛒</div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Your cart is empty</h3>
                <p className="text-zinc-500">Pick something amazing from the store!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Cart items */}
            <div className="md:col-span-2 space-y-6">
                <h3 className="font-black uppercase tracking-widest text-xs text-zinc-500">Items in Cart ({cart.length})</h3>
                <div className="space-y-4">
                    {cart.map((item) => (
                        <div key={item.cartItemId} className="flex gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-3xl group">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-zinc-900">
                                {item.image
                                    ? <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="font-bold text-sm text-white line-clamp-1">{item.name}</h4>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600">
                                        {item.variantTitle ? `${item.type} • ${item.variantTitle}` : item.type}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-2">
                                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                                            <Minus size={12} />
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-zinc-500 hover:text-red-400 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black tracking-tighter italic text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Bump */}
                <div
                    className={`p-5 rounded-3xl border-2 cursor-pointer transition-all
                        ${orderBumpAccepted ? 'border-indigo-500 bg-indigo-500/5' : 'border-dashed border-white/10 hover:border-white/20'}`}
                    onClick={() => setOrderBump(!orderBumpAccepted)}
                >
                    <div className="flex items-start gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                            ${orderBumpAccepted ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                            {orderBumpAccepted && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <p className="font-black text-sm text-white">YES! Add the Complete Bundle at 30% OFF</p>
                            </div>
                            <p className="text-xs text-zinc-400">
                                Get all future updates and bonus content for just{' '}
                                <span className="text-amber-400 font-bold">₹{orderBumpPrice.toLocaleString()}</span> extra.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-4">
                {/* Coupon */}
                <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl space-y-3">
                    <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" /> Coupon Code
                    </h3>
                    {coupon ? (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5">
                            <div>
                                <p className="text-xs font-black text-emerald-400 uppercase">{coupon.code}</p>
                                <p className="text-[10px] text-zinc-500">-₹{coupon.discountAmount.toLocaleString()} saved</p>
                            </div>
                            <button onClick={() => setCoupon(null)} className="text-zinc-500 hover:text-red-400 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                value={couponCode}
                                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                                placeholder="Enter code"
                                className="flex-1 bg-black border border-white/10 rounded-2xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-bold tracking-wider"
                            />
                            <button
                                onClick={applyCoupon}
                                disabled={couponLoading || !couponCode}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-2xl text-xs font-black transition-all disabled:opacity-50"
                            >
                                {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                            </button>
                        </div>
                    )}
                    {couponError && <p className="text-[10px] text-red-400 font-bold">{couponError}</p>}
                </div>

                {/* Price breakdown */}
                <div className="bg-white/[0.05] border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="font-black uppercase tracking-widest text-sm italic">Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 uppercase font-bold tracking-widest">Subtotal</span>
                            <span className="text-white font-black">₹{subtotal.toLocaleString()}</span>
                        </div>
                        {orderBumpAccepted && (
                            <div className="flex justify-between text-xs">
                                <span className="text-amber-400 uppercase font-bold tracking-widest">Bundle Add-on</span>
                                <span className="text-amber-400 font-black">+₹{orderBumpPrice.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 uppercase font-bold tracking-widest">Tax (18%)</span>
                            <span className="text-white font-black">₹{Math.round(tax).toLocaleString()}</span>
                        </div>
                        {coupon && (
                            <div className="flex justify-between text-xs">
                                <span className="text-emerald-400 uppercase font-bold tracking-widest">Discount</span>
                                <span className="text-emerald-400 font-black">-₹{coupon.discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="h-px bg-white/5 my-2" />
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Order Total</span>
                            <span className="text-2xl font-black italic tracking-tighter text-indigo-400">₹{Math.round(total).toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setStep('customer')}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95"
                    >
                        Checkout <ArrowRight size={14} />
                    </button>
                </div>
                <p className="text-[10px] text-center text-zinc-600 font-bold uppercase tracking-widest px-4 leading-relaxed">
                    Secure payments powered by Razorpay. SSL encrypted.
                </p>
            </div>
        </div>
    );
}
