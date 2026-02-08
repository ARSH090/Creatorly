"use client";

import React, { useState } from 'react';
import { generateUPILink } from '@/lib/payments/upi';
import { calculateGST, IndianHSNRates } from '@/lib/compliance/gst';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    price: number;
    type: string;
    image: string;
}

interface BioLinkStoreProps {
    creatorName?: string;
    creatorBio?: string;
    initialProducts?: Product[];
}

const BioLinkStore: React.FC<BioLinkStoreProps> = ({
    creatorName = 'Md Arsh Eqbal',
    creatorBio = 'Empowering 100k+ Indian creators. Get my exclusive templates & strategy calls below. 🇮🇳',
    initialProducts
}) => {
    const defaultProducts: Product[] = [
        { id: '1', name: 'Mastering Instagram Content', price: 999, type: 'Digital Goods', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=3474&auto=format&fit=crop' },
        { id: '2', name: '1-on-1 Strategy Call', price: 4999, type: 'Consultations', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=3474&auto=format&fit=crop' },
        { id: '3', name: 'Creator Lighting Preset', price: 499, type: 'Digital Goods', image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=3474&auto=format&fit=crop' },
    ];

    const products = initialProducts || defaultProducts;

    const [loading, setLoading] = useState(false);

    async function handlePurchase(product: Product) {
        setLoading(true);
        try {
            const gst = calculateGST(product.price, {
                rate: IndianHSNRates[product.type] || 18,
                stateOfOrigin: 'Delhi',
                stateOfConsumption: 'Maharashtra'
            });

            const response = await fetch('/api/payments/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: gst.totalAmount,
                    receipt: `prod_${product.id}_${Date.now()}`
                })
            });

            const order = await response.json();

            if (order.error) throw new Error(order.error);

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Creatorly',
                description: `Purchase: ${product.name}`,
                order_id: order.id,
                handler: function (response: any) {
                    alert(`Payment Successful! TXN: ${response.razorpay_payment_id}`);
                },
                prefill: {
                    name: 'Customer Name',
                    email: 'customer@example.com',
                },
                theme: { color: '#ea580c' }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Checkout failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-platinum flex flex-col items-center p-4">
            {/* Bio Profile */}
            <div className="w-full max-w-lg mt-12 mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-xl overflow-hidden mb-4 relative">
                    <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white text-3xl font-black">
                        {creatorName[0]}
                    </div>
                </div>
                <h1 className="text-2xl font-bold">{creatorName}</h1>
                <p className="text-foreground/60 text-center px-4 mt-2">
                    {creatorBio}
                </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mb-12">
                {['Instagram', 'YouTube', 'WhatsApp'].map(plat => (
                    <div key={plat} className="p-3 bg-white rounded-2xl shadow-sm border border-black/5 cursor-pointer hover:scale-110 transition-transform">
                        <span className="text-xs font-bold uppercase tracking-wider">{plat[0]}</span>
                    </div>
                ))}
            </div>

            {/* Grid of Storefront Items */}
            <div className="w-full max-w-lg space-y-4">
                {products.map((product) => (
                    <div
                        key={product.id}
                        onClick={() => handlePurchase(product)}
                        className="group creator-glass p-1 rounded-4xl cursor-pointer hover:scale-[1.02] transition-all duration-300"
                    >
                        <div className="bg-white dark:bg-zinc-900 rounded-[31px] p-4 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner bg-slate-100 shrink-0">
                                <Image src={product.image} alt={product.name} width={64} height={64} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{product.name}</h3>
                                <p className="text-sm text-foreground/50">{product.type}</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="font-extrabold text-primary">₹{product.price}</span>
                                <span className="text-[10px] font-bold opacity-30">{loading ? 'LOADING...' : 'PAY VIA RAZORPAY'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="mt-24 pb-12 text-center">
                <p className="text-xs font-bold uppercase tracking-widest opacity-30">© 2026 Creatorly</p>
                <div className="flex justify-center space-x-4 text-[10px] mt-2 text-foreground/40 font-bold">
                    <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
                </div>
                <p className="text-[10px] mt-4 italic opacity-30">Vocal for Local • Empowering Bharat 🇮🇳</p>
            </footer>
        </div>
    );
}

export default BioLinkStore;
