'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface SubscribeClientProps {
    plans: {
        monthly: { price: number; active: boolean };
        yearly: { price: number; active: boolean };
    };
    user: {
        name: string;
        email: string;
        contact?: string;
    };
    userId: string;
}

export default function SubscribeClient({ plans, user, userId }: SubscribeClientProps) {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly'); // Default to yearly for higher conversion
    const [isLoading, setIsLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');

    // Load Razorpay Script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            // 1. Create Subscription on Backend
            const res = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    couponCode: couponCode.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to initialize subscription');
            }

            const { subscriptionId, razorpayKey } = data;

            // 2. Open Razorpay Checkout
            const options = {
                key: razorpayKey,
                subscription_id: subscriptionId,
                name: "Creatorly",
                description: `Creatorly ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan`,
                image: "/logo.png", // Ensure this exists or use text
                handler: function (response: any) {
                    // Successful payment/mandate
                    // Verify via webhook or redirect to dashboard which checks status
                    toast.success('Subscription active! Redirecting...');
                    router.push('/dashboard');
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.contact
                },
                theme: {
                    color: "#0F172A"
                },
                modal: {
                    ondismiss: function () {
                        setIsLoading(false);
                        toast('Subscription cancelled', { icon: '⚠️' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error(response.error.description || 'Payment failed');
                setIsLoading(false);
            });
            rzp.open();

        } catch (error: any) {
            toast.error(error.message);
            setIsLoading(false);
        }
    };

    const monthlyPrice = plans.monthly.price;
    const yearlyPrice = plans.yearly.price;
    const yearlySavings = Math.round(((monthlyPrice * 12) - yearlyPrice) / (monthlyPrice * 12) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                        Start Your 14-Day Free Trial
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Unlock the full power of Creatorly. Cancel anytime.
                        <span className="block font-semibold text-blue-600 mt-2">
                            AutoPay required to activate trial.
                        </span>
                    </p>
                </div>

                {/* Plan Toggle */}
                <div className="flex justify-center">
                    <div className="bg-gray-100 p-1 rounded-xl inline-flex relative">
                        <button
                            onClick={() => setSelectedPlan('monthly')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${selectedPlan === 'monthly'
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setSelectedPlan('yearly')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedPlan === 'yearly'
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Yearly
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                Save {yearlySavings}%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Monthly Card */}
                    <Card className={`relative border-2 transition-all cursor-pointer ${selectedPlan === 'monthly' ? 'border-blue-600 shadow-xl scale-105' : 'border-gray-200 hover:border-blue-300'}`}
                        onClick={() => setSelectedPlan('monthly')}
                    >
                        <CardHeader>
                            <CardTitle className="text-2xl">Monthly</CardTitle>
                            <CardDescription>Flexible, month-to-month</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-extrabold">₹{monthlyPrice}</span>
                                <span className="text-gray-500 ml-2">/month</span>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> All Pro Features</li>
                                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Unlimited Products</li>
                                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Priority Support</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Yearly Card */}
                    <Card className={`relative border-2 transition-all cursor-pointer ${selectedPlan === 'yearly' ? 'border-blue-600 shadow-xl scale-105' : 'border-gray-200 hover:border-blue-300'}`}
                        onClick={() => setSelectedPlan('yearly')}
                    >
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-sm">
                            MOST POPULAR
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl">Yearly</CardTitle>
                            <CardDescription>Best value for creators</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-extrabold">₹{yearlyPrice}</span>
                                <span className="text-gray-500 ml-2">/year</span>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> All Pro Features</li>
                                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Unlimited Products</li>
                                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Priority Support</li>
                                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> 2 Months Free</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Section */}
                <div className="max-w-md mx-auto space-y-6">
                    <div className="space-y-2">
                        <Label>Coupon Code</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                            />
                            <Button variant="outline" onClick={() => toast.success('Coupon applied (if valid)')}>Apply</Button>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubscribe}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                        {isLoading ? 'Processing...' : `Start 14-Day Free Trial`}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                        Your card will be verified. No charges today. Subscription starts after 14 days unless cancelled.
                        By subscribing, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
}
