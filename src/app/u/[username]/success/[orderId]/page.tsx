import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { notFound } from 'next/navigation';
import { CheckCircle, Download, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default async function SuccessPage({ params }: { params: Promise<{ username: string; orderId: string }> }) {
    const { username, orderId } = await params;
    await connectToDatabase();

    const order = await Order.findById(orderId);
    if (!order || order.status !== 'success') {
        notFound();
    }

    const product = await Product.findById(order.productId);
    const creator = await User.findOne({ username });

    if (!product || !creator) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans flex items-center justify-center p-6">
            <div className="max-w-xl w-full space-y-12 text-center animate-in fade-in zoom-in duration-700">
                {/* Success Icon */}
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight">Purchase Successful!</h1>
                    <p className="text-zinc-500 font-medium">
                        Your order was processed successfully. You can now access your digital assets below.
                    </p>
                </div>

                {/* Product Card */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 space-y-8 text-left">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-zinc-800 rounded-2xl overflow-hidden relative border border-white/5">
                            {product.image && <img src={product.image} className="object-cover w-full h-full" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{product.name}</h3>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Order #{orderId.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <a
                            href={`/api/delivery/${orderId}`}
                            className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl"
                        >
                            <Download className="w-5 h-5" />
                            Download Assets
                        </a>
                        <p className="text-[10px] text-center text-zinc-600 mt-4 font-bold uppercase tracking-widest">
                            Downloads Remaining: {order.downloadLimit - order.downloadCount}
                        </p>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12 border-t border-white/5">
                    <Link href={`/u/${username}`} className="text-sm font-bold text-zinc-400 hover:text-white flex items-center gap-2 group">
                        <ShoppingBag className="w-4 h-4" />
                        Back to Store
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
