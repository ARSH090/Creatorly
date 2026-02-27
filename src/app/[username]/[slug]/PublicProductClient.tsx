'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { motion } from 'framer-motion';
import {
    Zap, Share2, Star, Lock, Clock, Shield,
    Globe, ChevronRight, Check, MessageCircle
} from 'lucide-react';

interface PublicProductClientProps {
    initialData: any;
    initialEmail?: string;
    initialCoupon?: string;
}

export default function PublicProductClient({
    initialData,
    initialEmail = '',
    initialCoupon = ''
}: PublicProductClientProps) {
    const router = useRouter();
    const { product, creator } = initialData;

    const [email, setEmail] = useState(initialEmail);
    const [couponCode, setCouponCode] = useState(initialCoupon);
    const [customPrice, setCustomPrice] = useState<number | "">(product.suggestedPrice || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        if (!email || !email.includes('@')) {
            setError("Please enter a valid email address");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Initiate Order
            const res = await fetch('/api/checkout/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    email,
                    amount: product.pricingType === 'pwyw' ? customPrice : (product.pricing?.salePrice || product.price),
                    couponCode
                })
            });

            const orderData = await res.json();
            if (!orderData.success) {
                throw new Error(orderData.error || "Failed to create order");
            }

            const options = {
                key: orderData.razorpayKeyId,
                amount: orderData.amount * 100,
                currency: "INR",
                name: "Creatorly",
                description: product.title,
                image: "/logo.png",
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    const verifyRes = await fetch('/api/checkout/razorpay/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
                            productId: product._id,
                            email,
                            customerName: email.split('@')[0],
                            amount: orderData.amount,
                            couponCode
                        })
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        router.push(`/order-success/${verifyData.orderId}`);
                    } else {
                        setError("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    email: email,
                },
                theme: { color: "#6366f1" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (err: any) {
            setError(err.message || "Failed to initiate checkout");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-[100] bg-black/50 backdrop-blur-2xl border-b border-white/[0.03]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Zap className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tighter">Creatorly</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Support</button>
                        <button className="bg-white/5 border border-white/10 text-white p-2.5 rounded-xl hover:bg-white/10 transition-all">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Left Content */}
                    <div className="flex-1 space-y-12">
                        {/* Cover Image */}
                        {product.image && (
                            <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                                <NextImage
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                    priority
                                />
                            </div>
                        )}

                        {/* Hero */}
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400">
                                <Zap className="w-3.5 h-3.5 fill-indigo-400/20" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{product.productType}</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tightest leading-[0.95] uppercase italic">
                                {product.title}
                            </h1>
                            <p className="text-xl text-zinc-500 leading-relaxed font-medium max-w-2xl">
                                {product.tagline || product.description?.substring(0, 160) + '...'}
                            </p>

                            <div className="flex flex-wrap items-center gap-6 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Joined by 1.2k+ creators</span>
                                </div>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />)}
                                    <span className="text-xs font-bold text-white ml-1">4.9/5 Rating</span>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-8 bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-colors group-hover:bg-indigo-500/10" />
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">About this product</h2>
                            <div className="prose prose-invert max-w-none text-zinc-400 font-medium leading-[1.8]">
                                {product.description}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                {[
                                    { icon: Lock, title: "Secure Access", desc: "Encoded via 256-bit SSL" },
                                    { icon: Clock, title: "Lifetime Access", desc: "No recurring fees ever" },
                                    { icon: Shield, title: "Verified Content", desc: "Guaranteed high quality" },
                                    { icon: Globe, title: "Global Access", desc: "Download from anywhere" }
                                ].map((feature) => (
                                    <div key={feature.title} className="flex gap-4 p-5 bg-black/40 rounded-3xl border border-white/5 group hover:border-indigo-500/20 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <feature.icon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm tracking-tight">{feature.title}</h4>
                                            <p className="text-xs text-zinc-600 font-medium">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Creator Section */}
                        <div className="flex items-center gap-8 p-10 bg-zinc-900/20 border border-white/5 rounded-[3rem]">
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shrink-0 overflow-hidden">
                                <NextImage
                                    src={creator.image || 'https://via.placeholder.com/150'}
                                    className="rounded-full object-cover border-4 border-[#030303]"
                                    alt={creator.name}
                                    fill
                                    sizes="96px"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">The Creator</p>
                                <h3 className="text-3xl font-black text-white tracking-tighter">{creator.name}</h3>
                                <p className="text-zinc-500 font-medium">{creator.bio || "Crafting digital assets for the next generation of creative builders."}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Sticky Sidebar (Purchase) */}
                    <div className="w-full lg:w-[420px] shrink-0">
                        <div className="sticky top-32 space-y-6">
                            <motion.div
                                layout
                                className="bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-10 shadow-3xl relative overflow-hidden group shadow-indigo-500/5"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-indigo-500/10" />

                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Limited Time Offer</span>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-5xl font-black text-white tracking-tightest mt-2 italic">₹{product.price}</h2>
                                                {product.compareAtPrice && (
                                                    <span className="text-xl text-zinc-700 line-through font-bold">₹{product.compareAtPrice}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">SAVE 40%</span>
                                        </div>
                                    </div>

                                    {/* Email Capture / Abandoned Checkout logic */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 italic">Enter Email to Checkout</label>
                                            <input
                                                type="email"
                                                placeholder="you@email.com"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setError(null);
                                                }}
                                                onBlur={() => {
                                                    // Capture abandoned checkout if email is entered
                                                    if (email.includes('@')) {
                                                        fetch('/api/checkout/capture-intent', {
                                                            method: 'POST',
                                                            body: JSON.stringify({ email, productId: product._id })
                                                        });
                                                    }
                                                }}
                                                className={`w-full bg-black border ${error ? 'border-red-500/50' : 'border-white/5'} rounded-2xl py-5 px-6 text-white font-bold placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all font-sans`}
                                            />
                                            {error && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-4 tracking-widest">{error}</p>}
                                        </div>

                                        {product.pricingType === 'pwyw' && (
                                            <div className="space-y-4 pt-4">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Name Your Price (Min: ₹{product.minPrice || 0})</label>
                                                <div className="relative group">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-700 group-focus-within:text-white transition-colors">₹</span>
                                                    <input
                                                        type="number"
                                                        value={customPrice}
                                                        onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : "")}
                                                        placeholder={product.suggestedPrice?.toString() || "0"}
                                                        className="w-full bg-black/60 border border-white/5 rounded-3xl py-6 pl-12 pr-6 text-4xl font-black text-white focus:outline-none focus:border-indigo-500/40 transition-all tracking-tighter"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4 pt-4">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Discount Code</label>
                                            <input
                                                type="text"
                                                placeholder="Enter code..."
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500/30 transition-all text-sm uppercase tracking-widest"
                                            />
                                        </div>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={loading}
                                            className="w-full bg-white text-black py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5 flex items-center justify-center gap-3 group"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Claim Access Now
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center">Instant Delivery via Email</p>
                                    </div>

                                    <div className="space-y-5 pt-4">
                                        {[
                                            "Instant one-click download",
                                            "Premium file quality guaranteed",
                                            "Dynamic PDF watermarking included",
                                            "24/7 dedicated creator support"
                                        ].map((item) => (
                                            <div key={item} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-indigo-400" />
                                                </div>
                                                <span className="text-xs font-bold text-zinc-400">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            <div className="bg-zinc-900/20 border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-center gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <Shield className="w-6 h-6 text-zinc-700" />
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Safe Payment</span>
                                </div>
                                <div className="w-px h-10 bg-white/5" />
                                <div className="flex flex-col items-center gap-2">
                                    <Clock className="w-6 h-6 text-zinc-700" />
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Global CDN</span>
                                </div>
                                <div className="w-px h-10 bg-white/5" />
                                <div className="flex flex-col items-center gap-2">
                                    <MessageCircle className="w-6 h-6 text-zinc-700" />
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Footer CTA Mob */}
            <div className="fixed bottom-0 left-0 right-0 p-4 z-[110] lg:hidden">
                <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-2xl">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Masterpiece Access</p>
                        <h4 className="text-xl font-black text-white italic tracking-tighter">₹{product.price}</h4>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
