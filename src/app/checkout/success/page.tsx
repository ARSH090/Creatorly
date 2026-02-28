/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */
import React from 'react';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Download, ExternalLink, Mail, ArrowRight, Package, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SuccessPage({ searchParams }: Props) {
    const { orderId } = await searchParams;

    if (!orderId || typeof orderId !== 'string') {
        notFound();
    }

    await connectToDatabase();
    const order = await Order.findById(orderId).populate('items.productId');

    if (!order || order.paymentStatus !== 'paid') {
        // Potentially show a "processing" or "pending" state instead of 404
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Package className="w-10 h-10 text-amber-500" />
                    </div>
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Order Processing</h1>
                    <p className="text-zinc-500 font-medium">We're finalizing your order. Please refresh this page in a few seconds.</p>
                    <Link
                        href={`/checkout/success?orderId=${orderId}`}
                        className="block w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center"
                    >
                        Check Status
                    </Link>
                </div>
            </div>
        );
    }

    const downloadLinks = order.metadata?.downloadLinks || [];

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30 py-20 px-6">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header Section */}
                <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">Purchase Complete</h1>
                        <p className="text-zinc-500 font-medium uppercase tracking-widest text-[10px]">Order #{order.orderNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">

                    {/* Left: Product & Download Section */}
                    <div className="md:col-span-3 space-y-8">
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-10 space-y-10">
                            <h2 className="text-xl font-black uppercase italic tracking-tight text-white">Your Assets</h2>

                            <div className="space-y-4">
                                {downloadLinks.length > 0 ? (
                                    downloadLinks.map((link: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                    <Download size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{link.name}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Secured Asset</p>
                                                </div>
                                            </div>
                                            <a
                                                href={link.url}
                                                download
                                                className="px-6 py-3 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-4">
                                        <Mail className="w-10 h-10 text-zinc-700 mx-auto" />
                                        <p className="text-sm font-bold text-zinc-600">Assets are being prepared. You'll receive an email shortly.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-center gap-4">
                                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                                <p className="text-[11px] font-medium leading-relaxed">
                                    Your download links are valid for <span className="text-white font-bold italic">72 hours</span>.
                                    A copy of these links has also been sent to <span className="text-white font-bold italic underline">{order.customerEmail}</span>.
                                </p>
                            </div>
                        </div>

                        {/* Order Details Accordion/List */}
                        <div className="bg-white/[0.02] rounded-[2rem] p-8 border border-white/5">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-6 px-2">
                                <span>Item</span>
                                <span>Price</span>
                            </div>
                            {order.items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
                                    <span className="text-sm font-bold text-zinc-300 italic uppercase">{item.name}</span>
                                    <span className="text-sm font-black text-white italic">₹{(item.price).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-6 px-2">
                                <span className="text-sm font-black uppercase tracking-widest text-zinc-500 italic">Total Paid</span>
                                <span className="text-2xl font-black text-emerald-400 italic">₹{order.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Creator Info & Next Steps */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-10 text-white space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                                <CheckCircle2 size={120} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none relative z-10">Build Your Own Store</h3>
                            <p className="text-sm font-medium text-white/80 leading-relaxed relative z-10">Loved the experience? Join 5,000+ creators selling their digital products on Creatorly.</p>
                            <Link href="/dashboard" className="flex items-center gap-3 bg-white text-black px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all w-fit relative z-10">
                                Get Started Free <ArrowRight size={14} />
                            </Link>
                        </div>

                        <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 text-center space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Need Help?</p>
                            <Link href="/support" className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors group">
                                Contact Support
                                <span className="group-hover:translate-x-1 transition-transform"><ExternalLink size={14} /></span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-700 hover:text-white transition-colors">Return to Home</Link>
                </div>
            </div>
        </div>
    );
}
