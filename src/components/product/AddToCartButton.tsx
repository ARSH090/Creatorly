'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';

interface AddToCartButtonProps {
    productId: string;
    productName: string;
    theme?: any;
    customAmount?: number;
    pricingType?: 'fixed' | 'pwyw' | 'free' | 'subscription';
    onClick?: () => void;
}

export default function AddToCartButton({
    productId,
    productName,
    theme,
    customAmount,
    pricingType = 'fixed',
    onClick
}: AddToCartButtonProps) {
    const primaryColor = theme?.primaryColor || '#6366f1';
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleAddToCart = async () => {
        if (onClick) {
            onClick();
            return;
        }
        setStatus('loading');

        // Logic for checkout would go here
        // If PWYW, we use customAmount.
        console.log(`[Checkout] Initiating checkout for ${productName} with amount: ${customAmount || 'default'}`);

        // Simulate Razorpay trigger or API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real app, this might redirect to a generic success page or a specific fulfillment page
        // window.location.href = `/checkout/success?productId=${productId}&amount=${customAmount}`;

        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    return (
        <button
            onClick={handleAddToCart}
            disabled={status !== 'idle'}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${status === 'success'
                ? 'bg-emerald-500 text-white'
                : 'text-white'
                }`}
            style={status !== 'success' ? {
                backgroundColor: primaryColor,
                boxShadow: `0 10px 15px -3px ${primaryColor}20`
            } : {}}
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
