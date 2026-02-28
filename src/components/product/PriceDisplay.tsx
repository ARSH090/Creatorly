'use client';

import React, { useState } from 'react';

interface PriceDisplayProps {
    price: number;
    compareAtPrice?: number;
    currency: string;
    productName: string;
    theme?: any;
    pricingType?: 'fixed' | 'pwyw' | 'free' | 'subscription';
    minPrice?: number;
}

export default function PriceDisplay({
    price,
    compareAtPrice,
    currency,
    productName,
    theme,
    pricingType = 'fixed',
    minPrice = 0
}: PriceDisplayProps) {
    const primaryColor = theme?.primaryColor || '#6366f1';
    const [hasLoggedHover, setHasLoggedHover] = useState(false);

    const handleMouseEnter = () => {
        if (!hasLoggedHover) {
            console.log(`[Analytics] Intent to Buy detected for: ${productName}`);
            setHasLoggedHover(true);
        }
    };

    if (pricingType === 'free') {
        return (
            <div className="text-4xl font-black tracking-tighter uppercase italic text-emerald-400">
                Free
            </div>
        );
    }

    return (
        <div className="space-y-1" onMouseEnter={handleMouseEnter}>
            <div className="flex items-baseline gap-2">
                <div className="flex flex-col">
                    {pricingType === 'pwyw' && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Starting from</span>
                    )}
                    <span className="text-4xl font-black tracking-tighter italic" style={{ color: primaryColor }}>
                        {currency === 'INR' ? '₹' : '$'}
                        {(pricingType === 'pwyw' ? minPrice : price).toLocaleString()}
                    </span>
                </div>
                {compareAtPrice && compareAtPrice > price && pricingType === 'fixed' && (
                    <span className="text-xl text-zinc-500 line-through decoration-red-500/50 decoration-2 tracking-tighter font-bold">
                        {currency === 'INR' ? '₹' : '$'}
                        {compareAtPrice.toLocaleString()}
                    </span>
                )}
            </div>
            {compareAtPrice && compareAtPrice > price && pricingType === 'fixed' && (
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">
                    Save {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% Today
                </div>
            )}
        </div>
    );
}
