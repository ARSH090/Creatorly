'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { ShoppingBag, Star, Zap, TrendingUp, Eye, Play, Lock, FileText, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useLeadStore } from '@/lib/store/useLeadStore';
import BookingModal from './BookingModal';

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
    layout?: 'grid' | 'list';
}

export default function ProductCard({ product, creator, theme, hasAccess, layout = 'grid' }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
    const { addToCart, setStep } = useCheckoutStore();
    const { openLeadModal } = useLeadStore();
    const router = useRouter();

    const isList = layout === 'list';

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

        // If coaching and no slot selected, open modal
        if (product.type === 'coaching' && !selectedSlot) {
            setIsBookingModalOpen(true);
            return;
        }

        // If free product, trigger lead capture modal directly
        if (product.price === 0) {
            openLeadModal({
                id: product.id,
                label: product.name,
                type: 'product',
                productId: product.id
            });
            return;
        }

        try {
            setIsCheckingOut(true);

            // Standardize: Add to cart and proceed
            addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1,
                type: product.type,
                creator: creator.username,
                metadata: selectedSlot ? {
                    bookingDate: selectedSlot.date.toISOString(),
                    bookingTime: selectedSlot.time
                } : undefined
            });

            // Redirect to Cart for review/details
            router.push('/cart');

        } catch (error) {
            console.error('Checkout Error:', error);
            alert('Could not add to cart. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const onSlotSelect = (slot: { date: Date; time: string }) => {
        setIsBookingModalOpen(false);
        setSelectedSlot(slot);

        // Auto-add to cart after slot selection
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            type: product.type,
            creator: creator.username,
            metadata: {
                bookingDate: slot.date.toISOString(),
                bookingTime: slot.time
            }
        });
        router.push('/cart');
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
            className={`group relative bg-[#0A0A0A] rounded-[1.5rem] overflow-hidden border border-white/5 transition-all duration-500 flex ${isList ? 'flex-col sm:flex-row' : 'flex-col'}`}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4, borderColor: theme.primaryColor + '40' }}
        >

            {/* Product Image & Overlay */}
            <div className={`relative overflow-hidden ${isList ? 'w-full sm:w-48 aspect-square' : 'aspect-[4/3]'}`}>
                <NextImage
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes={isList ? "192px" : "(max-width: 768px) 100vw, 50vw"}
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />

                {/* Type Badge */}
                <div className="absolute top-3 left-3 z-10">
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                        <div style={{ color: theme.primaryColor }}>{getTypeIcon()}</div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">{product.type}</span>
                    </div>
                </div>

                {/* Hover Action Overlay */}
                <AnimatePresence>
                    {(isHovered || isCheckingOut) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-20"
                        >
                            <button
                                onClick={handleAction}
                                disabled={isCheckingOut}
                                className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl disabled:opacity-50"
                                style={{
                                    backgroundColor: 'var(--button)',
                                    color: 'var(--button-text)',
                                    boxShadow: `0 10px 20px ${theme.primaryColor}20`
                                }}
                            >
                                {isCheckingOut ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : hasAccess ? (
                                    product.type === 'course' ? <Play className="w-4 h-4 fill-white" /> :
                                        product.type === 'membership' ? <Users className="w-4 h-4" /> :
                                            <ShoppingBag className="w-4 h-4" />
                                ) : (
                                    <ShoppingBag className="w-4 h-4" />
                                )}
                                {isCheckingOut ? '...' : (hasAccess ? 'Open' : 'Get It')}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Product Meta */}
            <div className={`p-5 sm:p-6 flex-1 flex flex-col justify-center ${isList ? 'sm:py-4' : ''}`}>
                <div className="flex justify-between items-start gap-3">
                    <h3 className="text-sm sm:text-lg font-bold leading-tight group-hover:text-white transition-colors line-clamp-2 overflow-hidden">
                        {product.name}
                    </h3>
                    <div className="text-right shrink-0">
                        <p className="text-lg font-black tracking-tight" style={{ color: theme.primaryColor }}>
                            ₹{product.price}
                        </p>
                    </div>
                </div>

                {!isList && (
                    <p className="text-zinc-500 text-xs mt-3 line-clamp-2 font-medium">
                        {product.description || 'Elevate your creative workflow with this premium digital asset.'}
                    </p>
                )}

                <div className={`flex items-center justify-between ${isList ? 'mt-3' : 'pt-4 mt-4 border-t border-white/5'}`}>
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-bold text-zinc-400">4.9 {isList ? '' : '(124)'}</span>
                    </div>

                    <div className="flex items-center gap-2 transition-all group-hover:translate-x-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">View</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    </div>
                </div>
            </div>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                product={product}
                creator={creator}
                onSelectSlot={onSlotSelect}
            />
        </motion.div>
    );
}
