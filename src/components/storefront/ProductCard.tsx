'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { ShoppingBag, Star, Zap, TrendingUp, Eye, Play, Lock, FileText, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        price: number;
        originalPrice?: number;
        image: string;
        type: 'digital' | 'course' | 'membership' | 'physical' | 'coaching';
        rating?: number;
        isBestSeller?: boolean;
        isNew?: boolean;
        description?: string;
    };
    creator: {
        id: string;
        username: string;
        displayName: string;
    };
    theme: any;
    hasAccess?: boolean;
}

export default function ProductCard({ product, creator, theme, hasAccess }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const router = useRouter();

    const handleAction = async () => {
        if (hasAccess) {
            if (product.type === 'course') {
                router.push(`/u/${creator.username}/learn/${product.id}`); // Using ID for robust routing
            } else if (product.type === 'membership') {
                router.push(`/u/${creator.username}/community`);
            } else {
                router.push(`/u/${creator.username}/success/${product.id}`); // Re-download
            }
            return;
        }

        try {
            setIsCheckingOut(true);

            // 1. Create Order on Backend
            const response = await fetch('/api/payments/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: product.price,
                    productId: product.id,
                    creatorId: creator.id,
                    customerEmail: 'customer@example.com', // In real app, prompt for email if guest
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Checkout failed');

            // 2. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                name: 'Creatorly',
                description: `Purchase: ${product.name}`,
                image: '/logo.png',
                order_id: data.id,
                handler: function (response: any) {
                    // This is for client-side redirection. 
                    // The webhook will handle status update in DB.
                    router.push(`/u/${creator.username}/success/${data.id}`);
                },
                prefill: {
                    name: 'Customer',
                    email: 'customer@example.com',
                },
                theme: {
                    color: theme.primaryColor,
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Checkout Error:', error);
            alert('Payment initialization failed. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const getTypeIcon = () => {
        switch (product.type) {
            case 'course': return <Play className="w-4 h-4" />;
            case 'membership': return <Users className="w-4 h-4" />;
            case 'digital': return <FileText className="w-4 h-4" />;
            default: return <ShoppingBag className="w-4 h-4" />;
        }
    };

    return (
        <motion.div
            className="group relative bg-[#0A0A0A] rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-500"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, borderColor: theme.primaryColor + '40' }}
        >
            <script src="https://checkout.razorpay.com/v1/checkout.js" async />

            {/* Product Image & Overlay */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <NextImage
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />

                {/* Type Badge */}
                <div className="absolute top-4 left-4 z-10">
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
                        <div style={{ color: theme.primaryColor }}>{getTypeIcon()}</div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{product.type}</span>
                    </div>
                </div>

                {/* Best Seller / New Badges */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                    {product.isBestSeller && (
                        <div className="bg-amber-500 p-2 rounded-xl shadow-xl shadow-amber-500/20">
                            <TrendingUp className="w-4 h-4 text-black" />
                        </div>
                    )}
                </div>

                {/* Hover Action Overlay */}
                <AnimatePresence>
                    {(isHovered || isCheckingOut) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-8 z-20"
                        >
                            <button
                                onClick={handleAction}
                                disabled={isCheckingOut}
                                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl disabled:opacity-50"
                                style={{
                                    backgroundColor: theme.primaryColor,
                                    color: '#fff',
                                    boxShadow: `0 20px 40px ${theme.primaryColor}30`
                                }}
                            >
                                {isCheckingOut ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : hasAccess ? (
                                    product.type === 'course' ? <Play className="w-5 h-5 fill-white" /> :
                                        product.type === 'membership' ? <Users className="w-5 h-5" /> :
                                            <ShoppingBag className="w-5 h-5" />
                                ) : (
                                    <ShoppingBag className="w-5 h-5" />
                                )}
                                {isCheckingOut ? 'Processing...' : (hasAccess ? (product.type === 'course' ? 'Start Learning' : product.type === 'membership' ? 'Join Community' : 'Download Now') : 'Get Access Now')}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Product Meta */}
            <div className="p-8 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-bold leading-tight group-hover:text-white transition-colors">
                        {product.name}
                    </h3>
                    <div className="text-right">
                        <p className="text-2xl font-black tracking-tight" style={{ color: theme.primaryColor }}>
                            ₹{product.price}
                        </p>
                    </div>
                </div>

                <p className="text-zinc-500 text-sm line-clamp-2 font-medium">
                    {product.description || 'Elevate your creative workflow with this premium digital asset.'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-zinc-400">4.9 (124)</span>
                    </div>

                    <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">View Details</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
