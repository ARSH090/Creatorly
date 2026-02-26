'use client';

import React, { useState } from 'react';
import PriceDisplay from './PriceDisplay';
import AddToCartButton from './AddToCartButton';
import DigitalCheckoutModal from '../checkout/DigitalCheckoutModal';

interface ProductInfoProps {
    product: any;
    theme: any;
}

export default function ProductInfo({ product, theme }: ProductInfoProps) {
    const [customAmount, setCustomAmount] = useState(product.pricingType === 'pwyw' ? product.minPrice || 0 : product.price || 0);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    const isPwyw = product.pricingType === 'pwyw';
    const minPrice = product.minPrice || 0;

    return (
        <div className="space-y-10 lg:sticky lg:top-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        {product.productType?.replace('_', ' ') || product.type}
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                    {product.title || product.name}
                </h1>
                {product.tagline && (
                    <p className="text-xl font-bold text-zinc-500 italic tracking-tight">{product.tagline}</p>
                )}
            </div>

            <PriceDisplay
                price={product.price || 0}
                compareAtPrice={product.compareAtPrice}
                currency={product.currency || 'INR'}
                productName={product.title || product.name || ''}
                theme={theme}
                pricingType={product.pricingType}
                minPrice={product.minPrice}
            />

            {isPwyw && (
                <div className="space-y-4 p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Name your price (Min ₹{minPrice})</label>
                    <div className="relative group">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-700 group-focus-within:text-white transition-colors">₹</span>
                        <input
                            type="number"
                            min={minPrice}
                            value={customAmount}
                            onChange={(e) => setCustomAmount(Number(e.target.value))}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-3xl font-black text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                    {customAmount < minPrice && (
                        <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest px-2">Please enter at least ₹{minPrice}</p>
                    )}
                </div>
            )}

            <AddToCartButton
                productId={product._id}
                productName={product.title || product.name || ''}
                theme={theme}
                pricingType={product.pricingType}
                customAmount={isPwyw ? customAmount : product.price}
                onClick={() => setIsCheckoutOpen(true)}
            />

            <DigitalCheckoutModal
                open={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
                product={product}
                customAmount={isPwyw ? customAmount : product.price}
            />

            <div className="flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex flex-col items-center lg:items-start">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Secure</span>
                    <div className="flex gap-2">
                        <img src="/icons/visa.svg" alt="Visa" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
                        <img src="/icons/mastercard.svg" alt="Mastercard" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
                        <img src="/icons/upi.svg" alt="UPI" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
                    </div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Quality</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase italic">Curated & Verified</span>
                </div>
            </div>
        </div>
    );
}
