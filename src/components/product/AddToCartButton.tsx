'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';

interface AddToCartButtonProps {
    productId: string;
    productName: string;
}

export default function AddToCartButton({ productId, productName }: AddToCartButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleAddToCart = async () => {
        setStatus('loading');

        // Simulate API call for optimistic UI
        await new Promise(resolve => setTimeout(resolve, 800));

        // In a real app, this would update a global cart state (Zustand/Redux)
        console.log(`[Cart] Added ${productName} (${productId}) to cart`);

        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    return (
        <button
            onClick={handleAddToCart}
            disabled={status !== 'idle'}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${status === 'success'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                }`}
        >
            {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : status === 'success' ? (
                <>
                    <Check className="w-5 h-5" />
                    Added to Cart
                </>
            ) : (
                <>
                    <ShoppingCart className="w-5 h-5" />
                    Buy Now
                </>
            )}
        </button>
    );
}
