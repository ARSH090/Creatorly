'use client';

import { useEffect, useState } from 'react';
import { Crown, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TierStatus {
    tier: 'free' | 'creator' | 'pro';
    status: string;
    limits: {
        products: number;
        storage: number;
        leads: number;
        ordersLifetime: number;
    };
    usage: {
        products: number;
        storage: number;
        leads: number;
        ordersLifetime: number;
    };
    upgradeUrl: string;
}

const TIER_NAMES = {
    free: 'Free',
    creator: 'Creator',
    pro: 'Creator Pro'
};

const TIER_COLORS = {
    free: 'bg-gray-100 text-gray-800 border-gray-300',
    creator: 'bg-blue-100 text-blue-800 border-blue-300',
    pro: 'bg-purple-100 text-purple-800 border-purple-300'
};

export default function TierStatusWidget() {
    const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTierStatus();
    }, []);

    const fetchTierStatus = async () => {
        try {
            const res = await fetch('/api/user/tier-status');
            if (res.ok) {
                const data = await res.json();
                setTierStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch tier status:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (!tierStatus) return null;

    const isAtLimit = (feature: keyof TierStatus['usage']) => {
        return tierStatus.usage[feature] >= tierStatus.limits[feature];
    };

    const getUsagePercent = (feature: keyof TierStatus['usage']) => {
        if (tierStatus.limits[feature] === -1) return 0; // Unlimited
        return Math.min((tierStatus.usage[feature] / tierStatus.limits[feature]) * 100, 100);
    };

    const tierColor = TIER_COLORS[tierStatus.tier];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {tierStatus.tier === 'free' && <Zap className="w-5 h-5 text-gray-500" />}
                    {tierStatus.tier === 'creator' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                    {tierStatus.tier === 'pro' && <Crown className="w-5 h-5 text-purple-500" />}
                    <h3 className="text-lg font-semibold text-gray-900">Your Plan</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${tierColor}`}>
                    {TIER_NAMES[tierStatus.tier]}
                </span>
            </div>

            {/* Usage Stats */}
            <div className="space-y-4">
                {/* Products */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Products</span>
                        <span className={`font-medium ${isAtLimit('products') ? 'text-red-600' : 'text-gray-900'}`}>
                            {tierStatus.usage.products} / {tierStatus.limits.products === -1 ? '∞' : tierStatus.limits.products}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full transition-all ${isAtLimit('products') ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${getUsagePercent('products')}%` }}
                        />
                    </div>
                </div>

                {/* Lifetime Orders (Free tier only) */}
                {tierStatus.tier === 'free' && (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Lifetime Orders</span>
                            <span className={`font-medium ${isAtLimit('ordersLifetime') ? 'text-red-600' : 'text-gray-900'}`}>
                                {tierStatus.usage.ordersLifetime} / {tierStatus.limits.ordersLifetime}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full transition-all ${isAtLimit('ordersLifetime') ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${getUsagePercent('ordersLifetime')}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Storage */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Storage</span>
                        <span className="font-medium text-gray-900">
                            {(tierStatus.usage.storage / 1024).toFixed(1)} GB / {tierStatus.limits.storage === -1 ? '∞' : `${tierStatus.limits.storage / 1024} GB`}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all"
                            style={{ width: `${getUsagePercent('storage')}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Upgrade CTA */}
            {tierStatus.tier !== 'pro' && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    {isAtLimit('products') || isAtLimit('ordersLifetime') ? (
                        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-900">Limit Reached</p>
                                <p className="text-yellow-700">Upgrade to continue growing your business</p>
                            </div>
                        </div>
                    ) : null}

                    <Link
                        href={tierStatus.upgradeUrl}
                        className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
                    >
                        {tierStatus.tier === 'free' ? 'Upgrade to Creator' : 'Upgrade to Pro'}
                    </Link>

                    {tierStatus.tier === 'free' && (
                        <p className="text-xs text-center text-gray-500 mt-2">
                            Platform fee: 10% → 2% with Creator plan
                        </p>
                    )}
                </div>
            )}

            {/* Pro Badge */}
            {tierStatus.tier === 'pro' && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Crown className="w-4 h-4" />
                        <span className="font-medium">You're on the best plan! 0% platform fee</span>
                    </div>
                </div>
            )}
        </div>
    );
}
