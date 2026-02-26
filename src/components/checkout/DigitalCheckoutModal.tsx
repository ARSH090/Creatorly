'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, Tag, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DigitalCheckoutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: any;
    customAmount?: number;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function DigitalCheckoutModal({ open, onOpenChange, product, customAmount }: DigitalCheckoutModalProps) {
    const [email, setEmail] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [finalAmount, setFinalAmount] = useState(customAmount || product.pricing?.basePrice || product.price || 0);

    useEffect(() => {
        setFinalAmount(customAmount || product.pricing?.basePrice || product.price || 0);
    }, [customAmount, product]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsApplyingCoupon(true);
        setCouponError('');

        try {
            // We can call a validate coupon API here
            const res = await fetch('/api/checkout/razorpay/create-digital-order', {
                method: 'POST', // Just to check the price calculation
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    couponCode: couponCode,
                    customerEmail: email || 'test@example.com', // fallback for validation
                    customPrice: customAmount
                })
            });
            const data = await res.json();
            if (data.success) {
                setFinalAmount(data.amount);
                setAppliedCoupon({ code: couponCode, discount: (customAmount || product.price) - data.amount });
            } else {
                setCouponError(data.error || 'Invalid coupon');
            }
        } catch (err) {
            setCouponError('Failed to validate coupon');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleCheckout = async () => {
        if (!email) return alert('Please enter your email for delivery');
        setIsProcessing(true);

        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) throw new Error('Razorpay SDK failed to load');

            const res = await fetch('/api/checkout/razorpay/create-digital-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    couponCode: appliedCoupon?.code,
                    customerEmail: email,
                    customPrice: customAmount
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            if (data.isFree) {
                // Fulfill free order
                const freeRes = await fetch('/api/checkout/free/fulfill', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: product._id, email: email })
                });
                const freeData = await freeRes.json();
                if (freeData.success) {
                    window.location.href = `/checkout/success?orderId=${freeData.orderId}`;
                } else {
                    throw new Error(freeData.error || 'Failed to fulfill free order');
                }
                return;
            }

            const options = {
                key: data.key,
                amount: data.amount * 100,
                currency: data.currency,
                name: 'Creatorly',
                description: `Purchase: ${product.title || product.name}`,
                order_id: data.orderId,
                handler: async function (response: any) {
                    setIsProcessing(true);
                    try {
                        const verifyRes = await fetch('/api/checkout/razorpay/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                productId: product._id,
                                email: email,
                                amount: finalAmount,
                                couponCode: appliedCoupon?.code
                            })
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            window.location.href = `/checkout/success?orderId=${verifyData.orderId}`;
                        } else {
                            throw new Error(verifyData.error || 'Verification failed');
                        }
                    } catch (err: any) {
                        alert(err.message || 'Payment verification failed. Please contact support.');
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    email: email,
                },
                theme: {
                    color: '#6366f1',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err: any) {
            alert(err.message || 'Payment initiation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-[#0A0A0A] border-white/5 p-0 overflow-hidden rounded-[2.5rem]">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">Secure Checkout</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium">Get instant access to your digital products.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                            <div className="w-16 h-16 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                <img src={product.thumbnail || product.image || '/placeholder-product.png'} alt={product.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate">{product.title || product.name}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{product.productType || 'Digital Product'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-white italic">₹{finalAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Delivery Email</label>
                            <input
                                type="email"
                                placeholder="where should we send the files?"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
                            />
                        </div>

                        {/* Coupon Section */}
                        {!appliedCoupon ? (
                            <div className="space-y-2">
                                <div className="relative group">
                                    <Tag className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-white transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="GOT A COUPON?"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-14 pr-24 text-white font-black uppercase tracking-widest placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={!couponCode || isApplyingCoupon}
                                        className="absolute right-2 top-2 bottom-2 bg-white/5 hover:bg-white/10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all disabled:opacity-30"
                                    >
                                        {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                    </button>
                                </div>
                                {couponError && <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest ml-2">{couponError}</p>}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animat-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Coupon Applied: {appliedCoupon.code}</span>
                                </div>
                                <button onClick={() => { setAppliedCoupon(null); setFinalAmount(customAmount || product.price); }} className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Remove</button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing || !email}
                            className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isProcessing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Complete Purchase
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-zinc-600" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Secure 128-bit Encrypted Payment</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
