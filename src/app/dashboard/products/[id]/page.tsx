'use client';

import React, { useState, useEffect } from "react";
import {
    ArrowLeft, Edit, Share2, Eye, Download, Trash2,
    BarChart3, Users, DollarSign, TrendingUp,
    Calendar, Clock, Star, MessageSquare, Heart,
    ShoppingCart, ExternalLink, Copy, Settings,
    Package, FileText, Video, Image
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (product && activeTab === 'analytics') {
            fetchAnalytics();
        }
    }, [product, activeTab]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/creator/products/${id}`);
            const data = await res.json();
            setProduct(data.product);
        } catch (error) {
            console.error("Failed to fetch product:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await fetch(`/api/products/${id}/analytics`);
            const data = await res.json();
            setAnalytics(data.data);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const copyProductLink = () => {
        const link = `${window.location.origin}/p/${product?.slug}`;
        navigator.clipboard.writeText(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Product Not Found</h2>
                    <button
                        onClick={() => router.push('/dashboard/products')}
                        className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Package },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'reviews', label: 'Reviews', icon: MessageSquare },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-[#030303]">
            {/* Header */}
            <div className="sticky top-0 bg-[#030303]/95 backdrop-blur-xl border-b border-white/5 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/dashboard/products')}
                                className="p-2 text-zinc-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-black text-white">{product.title}</h1>
                                <p className="text-sm text-zinc-500">
                                    {product.productType?.replace('_', ' ').toUpperCase()} • {formatDate(product.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={copyProductLink}
                                className="p-2 text-zinc-400 hover:text-white transition-colors"
                                title="Copy product link"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                            <button
                                className="p-2 text-zinc-400 hover:text-white transition-colors"
                                title="Share product"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            <Link
                                href={`/dashboard/products/${id}/setup`}
                                className="p-2 text-zinc-400 hover:text-white transition-colors"
                                title="Edit product"
                            >
                                <Edit className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Product Info Card */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 mb-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                            <div className="flex items-start gap-4 mb-6">
                                {product.coverImageUrl ? (
                                    <img
                                        src={product.coverImageUrl}
                                        alt={product.title}
                                        className="w-24 h-24 rounded-2xl object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-zinc-600" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-black text-white mb-2">{product.title}</h2>
                                    {product.tagline && (
                                        <p className="text-zinc-400 mb-4">{product.tagline}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                            product.status === 'published' 
                                                ? 'bg-emerald-500/10 text-emerald-400' 
                                                : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                            {product.status}
                                        </span>
                                        <span className="text-zinc-500">
                                            {product.productType?.replace('_', ' ')}
                                        </span>
                                        {product.pricingType && (
                                            <span className="text-zinc-500">
                                                {product.pricingType.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {product.description && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-white mb-3">Description</h3>
                                    <p className="text-zinc-300 leading-relaxed">{product.description}</p>
                                </div>
                            )}

                            {product.tags && product.tags.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-white mb-3">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-xl text-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:w-80">
                            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-black text-white mb-4">Performance</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Sales</span>
                                        <span className="text-white font-bold">{product.totalSales || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Revenue</span>
                                        <span className="text-emerald-400 font-bold">
                                            {formatCurrency(product.totalRevenue || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Views</span>
                                        <span className="text-white font-bold">{product.viewCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Rating</span>
                                        <span className="text-white font-bold">
                                            {product.avgRating ? `${product.avgRating.toFixed(1)} ⭐` : 'No ratings'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Reviews</span>
                                        <span className="text-white font-bold">{product.reviewCount || 0}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <h4 className="text-sm font-black text-white mb-3">Pricing</h4>
                                    <div className="space-y-2">
                                        {product.pricingType === 'free' ? (
                                            <div className="text-2xl font-black text-emerald-400">FREE</div>
                                        ) : product.pricingType === 'pwyw' ? (
                                            <div>
                                                <div className="text-sm text-zinc-400">Pay What You Want</div>
                                                <div className="text-lg font-bold text-white">
                                                    Min: {formatCurrency(product.minPrice || 0)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                {product.pricing?.salePrice ? (
                                                    <div>
                                                        <div className="text-lg font-bold text-white">
                                                            {formatCurrency(product.pricing.salePrice)}
                                                        </div>
                                                        <div className="text-sm text-zinc-500 line-through">
                                                            {formatCurrency(product.pricing.basePrice)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-lg font-bold text-white">
                                                        {formatCurrency(product.pricing?.basePrice || product.price || 0)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <Link
                                        href={`/p/${product.slug}`}
                                        target="_blank"
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View Public Page
                                    </Link>
                                    <Link
                                        href={`/dashboard/products/${id}/setup`}
                                        className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-white py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Product
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden">
                    <div className="flex border-b border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/5'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h3 className="text-xl font-black text-white mb-4">Product Overview</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Total Sales', value: product.totalSales || 0, icon: ShoppingCart, color: 'indigo' },
                                                { label: 'Revenue', value: formatCurrency(product.totalRevenue || 0), icon: DollarSign, color: 'emerald' },
                                                { label: 'Views', value: product.viewCount || 0, icon: Eye, color: 'amber' },
                                                { label: 'Conversion Rate', value: `${((product.totalSales || 0) / Math.max(product.viewCount || 1, 1) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'purple' }
                                            ].map((stat, index) => (
                                                <div key={stat.label} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                                            <stat.icon className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                                                    </div>
                                                    <div className="text-xl font-black text-white">{stat.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-white mb-4">Recent Activity</h3>
                                        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                                            <p className="text-zinc-400 text-center py-8">
                                                Recent activity will appear here
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'analytics' && (
                                <motion.div
                                    key="analytics"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {analyticsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : analytics ? (
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-xl font-black text-white mb-4">Sales Analytics</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                                                        <h4 className="text-sm font-medium text-zinc-400 mb-2">Total Revenue</h4>
                                                        <div className="text-2xl font-black text-white">
                                                            {formatCurrency(analytics.totalRevenue || 0)}
                                                        </div>
                                                    </div>
                                                    <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                                                        <h4 className="text-sm font-medium text-zinc-400 mb-2">Average Order Value</h4>
                                                        <div className="text-2xl font-black text-white">
                                                            {formatCurrency(analytics.avgOrderValue || 0)}
                                                        </div>
                                                    </div>
                                                    <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                                                        <h4 className="text-sm font-medium text-zinc-400 mb-2">Conversion Rate</h4>
                                                        <div className="text-2xl font-black text-white">
                                                            {analytics.conversionRate || 0}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-black text-white mb-4">Traffic Sources</h3>
                                                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                                                    <p className="text-zinc-400 text-center py-8">
                                                        Traffic source analytics will appear here
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-zinc-400">No analytics data available</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'customers' && (
                                <motion.div
                                    key="customers"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="text-center py-12">
                                        <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-black text-white mb-2">Customer Analytics</h3>
                                        <p className="text-zinc-400">Customer data and insights will appear here</p>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'reviews' && (
                                <motion.div
                                    key="reviews"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="text-center py-12">
                                        <MessageSquare className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-black text-white mb-2">Customer Reviews</h3>
                                        <p className="text-zinc-400">Customer reviews and ratings will appear here</p>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-black text-white mb-4">Product Settings</h3>
                                            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
                                                <p className="text-zinc-400 text-center py-8">
                                                    Advanced product settings will appear here
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-white mb-4">Danger Zone</h3>
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                                                <button className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 py-3 rounded-xl font-medium hover:bg-red-500/30 transition-colors border border-red-500/30">
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete Product
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
