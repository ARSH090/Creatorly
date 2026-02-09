'use client';

import React, { useState } from 'react';

interface PriceDisplayProps {
    price: number;
    compareAtPrice?: number;
    currency: string;
    productName: string;
}

export default function PriceDisplay({ price, compareAtPrice, currency, productName }: PriceDisplayProps) {
    const [hasLoggedHover, setHasLoggedHover] = useState(false);

    const handleMouseEnter = () => {
        if (!hasLoggedHover) {
            console.log(`[Analytics] Intent to Buy detected for: ${productName}`);
            // In a real app, send this to an analytics endpoint
            // fetch('/api/analytics/track', { method: 'POST', body: JSON.stringify({ event: 'intent_to_buy', product: productName }) });
            setHasLoggedHover(true);
        }
    };

    return (
        <div className="space-y-1" onMouseEnter={handleMouseEnter}>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter italic">
                    {currency === 'INR' ? '₹' : '$'}
                    {price.toLocaleString()}
                </span>
                {compareAtPrice && compareAtPrice > price && (
                    <span className="text-xl text-zinc-500 line-through decoration-red-500/50 decoration-2 tracking-tighter font-bold">
                        {currency === 'INR' ? '₹' : '$'}
                        {compareAtPrice.toLocaleString()}
                    </span>
                )}
            </div>
            {compareAtPrice && compareAtPrice > price && (
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">
                    Save {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% Today
                </div>
            )}
        </div>
    );
}
