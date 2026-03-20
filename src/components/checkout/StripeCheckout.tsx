'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutProps {
    productId: string;
    buyerEmail: string;
    buyerName: string;
    couponCode?: string;
    price: number;
    currency?: string;
}

export default function StripeCheckout({ productId, buyerEmail, buyerName, couponCode, price, currency = 'INR' }: StripeCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleStripeCheckout = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/checkout/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, buyerEmail, buyerName, couponCode }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            } else {
                const stripe = await stripePromise;
                if (!stripe) throw new Error('Stripe failed to load');
                await stripe.redirectToCheckout({ sessionId: data.sessionId });
            }
        } catch (err: any) {
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            {error && (
                <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm border border-red-500/20">
                    {error}
                </div>
            )}
            <button
                onClick={handleStripeCheckout}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
                {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
                    : <><CreditCard size={18} /> Pay with Card (International)</>
                }
            </button>
            <p className="text-center text-xs text-zinc-500">Secured by Stripe · All major cards accepted</p>
        </div>
    );
}
