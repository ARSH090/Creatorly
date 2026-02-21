import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { getTokensByOrder } from '@/lib/services/downloadToken';
import { notFound } from 'next/navigation';
import { CheckCircle, Download, ArrowRight, ShoppingBag, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default async function SuccessPage({ params }: { params: Promise<{ username: string; orderId: string }> }) {
    const { username, orderId } = await params;
    await connectToDatabase();

    let order = await Order.findById(orderId);
    if (!order) {
        order = await Order.findOne({ razorpayOrderId: orderId });
    }

    // Standardized status check: must be 'completed'
    if (!order || (order.status !== 'completed' && order.status !== 'success')) {
        notFound();
    }

    const creator = await User.findOne({ username });
    if (!creator) {
        notFound();
    }

    // Fetch tokens for this order to provide secure links
    const tokens = await getTokensByOrder(order._id.toString());

    // Enrich order items with product and token info
    const enrichedItems = await Promise.all(order.items.map(async (item) => {
        const product = await Product.findById(item.productId);
        const token = tokens.find(t => t.productId.toString() === item.productId.toString());
        return {
            ...item,
            product,
            token: token?.token
        };
    }));

    const digitalItems = enrichedItems.filter(item =>
        ['digital', 'course', 'digital_download'].includes(item.type) && item.token
    );

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans flex items-center justify-center p-6 py-20">
            <div className="max-w-2xl w-full space-y-12 text-center animate-in fade-in zoom-in duration-700">
                {/* Success Icon */}
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight">Success!</h1>
                    <p className="text-zinc-500 font-medium">
                        Your order was processed successfully. Access your {digitalItems.length > 1 ? 'assets' : 'asset'} below.
                    </p>
                </div>

                {/* Digital Assets Section */}
                {digitalItems.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] text-left px-4">Your Purchased Items</h2>
                        <div className="grid gap-4">
                            {digitalItems.map((item, idx) => (
                                <div key={idx} className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 text-left group hover:border-white/10 transition-colors">
                                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl overflow-hidden relative border border-white/5 flex-shrink-0">
                                        {item.product?.image ? (
                                            <img src={item.product.image} className="object-cover w-full h-full" alt={item.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-zinc-700" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold truncate">{item.name}</h3>
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">
                                            {item.type.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <a
                                        href={`/api/delivery/token/${item.token}`}
                                        className="bg-white text-black h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl whitespace-nowrap"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Non-digital Items Info */}
                {enrichedItems.length > digitalItems.length && (
                    <div className="bg-zinc-900/30 rounded-2xl p-6 border border-white/5 text-left flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-500">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white mb-1">Looking for coaching or other items?</p>
                            <p className="text-xs text-zinc-500">
                                Check your email for booking links and next steps for non-digital items in this order.
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Links */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 border-t border-white/5">
                    <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Order ID: {orderId.slice(-8).toUpperCase()}</p>
                    <Link href={`/u/${username}`} className="text-sm font-bold text-white flex items-center gap-2 group hover:text-indigo-400 transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                        Explore More
                        <ArrowRight className="w-4 h-4 transition-all group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
