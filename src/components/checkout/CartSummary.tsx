'use client';

import React from 'react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import Image from 'next/image';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export default function CartSummary() {
    const { cart, removeFromCart, updateQuantity, setStep } = useCheckoutStore();

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18; // 18% GST/Tax
    const total = subtotal + tax;

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
            <div className="md:col-span-2 space-y-6">
                <h3 className="font-black uppercase tracking-widest text-xs text-zinc-500">Items in Cart ({cart.length})</h3>
                <div className="space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-3xl group">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="font-bold text-sm text-white line-clamp-1">{item.name}</h4>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600">{item.type}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-2">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                                            <Minus size={12} />
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
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
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
                <div className="bg-white/[0.05] border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="font-black uppercase tracking-widest text-sm italic">Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 uppercase font-bold tracking-widest">Subtotal</span>
                            <span className="text-white font-black">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 uppercase font-bold tracking-widest">Tax (18%)</span>
                            <span className="text-white font-black">₹{tax.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-white/5 my-4" />
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Order Total</span>
                            <span className="text-2xl font-black italic tracking-tighter text-indigo-400">₹{total.toLocaleString()}</span>
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
                    By proceeding, you agree to our Terms of Service. Secure payments powered by Razorpay.
                </p>
            </div>
        </div>
    );
}
