'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Check, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpsellPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [upsell, setUpsell] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const sessionToken = searchParams.get('session');
    const upsellId = params.id;

    useEffect(() => {
        const fetchUpsell = async () => {
            try {
                // We'll add a public endpoint for this or reuse a manage one if it's open (usually should be a public GET)
                const res = await fetch(`/api/v1/upsells/${upsellId}`);
                const data = await res.json();
                if (data.upsell) {
                    setUpsell(data.upsell);
                    if (data.upsell.expiresSeconds > 0) {
                        setTimeLeft(data.upsell.expiresSeconds);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch upsell:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUpsell();
    }, [upsellId]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAccept = async () => {
        setAccepting(true);
        try {
            const res = await fetch(`/api/v1/upsells/${upsellId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken })
            });
            const data = await res.json();
            if (data.success && data.redirectUrl) {
                router.push(data.redirectUrl);
            }
        } catch (err) {
            console.error('Error accepting upsell:', err);
            setAccepting(false);
        }
    };

    const handleDecline = () => {
        router.push(`/thank-you/${sessionToken}`);
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading offer...</div>;
    if (!upsell) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Offer not found.</div>;

    const offerProduct = upsell.offerProductId;
    const price = upsell.priceOverride || offerProduct.pricing.basePrice;

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <main className="max-w-xl mx-auto px-6 py-12 flex flex-col min-h-screen">

                {/* Header Section */}
                <div className="text-center space-y-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                    >
                        Wait! Your order is not complete
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-tight">
                        {upsell.headline}
                    </h1>

                    {upsell.subheadline && (
                        <p className="text-zinc-500 text-lg font-medium italic">
                            {upsell.subheadline}
                        </p>
                    )}
                </div>

                {/* Offer Image */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl shadow-indigo-500/10 mb-8"
                >
                    <img
                        src={offerProduct.coverImageUrl || offerProduct.image}
                        alt={upsell.headline}
                        className="w-full h-full object-cover"
                    />

                    {timeLeft !== null && (
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 text-amber-400">
                            <Clock size={16} />
                            <span className="font-black tracking-tighter text-xl">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </motion.div>

                {/* Description */}
                <div className="flex-1 space-y-6 mb-12">
                    <div className="prose prose-invert text-zinc-400 text-base leading-relaxed">
                        {upsell.bodyCopy || offerProduct.description}
                    </div>
                </div>

                {/* Sticky Bottom Actions */}
                <div className="sticky bottom-0 bg-[#030303] pt-6 pb-2 space-y-4">
                    <div className="text-center mb-4">
                        <span className="text-zinc-500 text-xs font-black uppercase tracking-widest block mb-1">Add to order for just</span>
                        <span className="text-4xl font-black tracking-tighter text-white">
                            {offerProduct.pricing.currency} {price}
                        </span>
                    </div>

                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full py-5 bg-green-500 hover:bg-green-600 text-black rounded-3xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {accepting ? (
                            'Processing...'
                        ) : (
                            <>
                                YES, ADD THIS TO MY ORDER <Check size={20} strokeWidth={3} />
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleDecline}
                        disabled={accepting}
                        className="w-full py-2 text-zinc-600 hover:text-zinc-400 font-bold text-xs transition-all flex items-center justify-center gap-2 group"
                    >
                        No thanks, I don't want this
                    </button>
                </div>
            </main>
        </div>
    );
}
