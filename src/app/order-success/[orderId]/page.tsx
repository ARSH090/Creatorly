'use client';

import React, { useState, useEffect } from "react";
import {
    CheckCircle2, Download, Play,
    ArrowRight, Mail, Shield,
    Zap, ExternalLink, Package
} from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function OrderSuccessPage() {
    const { orderId } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // We'll need a public order fetch API or use a session-based one
                const res = await fetch(`/api/orders/public/${orderId}`);
                const data = await res.json();
                setOrder(data.order);
            } catch (error) {
                console.error("Failed to fetch order:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    if (loading) return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!order) return <div className="min-h-screen bg-[#030303] text-white p-20 text-center">Order Not Found</div>;

    const isCourse = order.items.some((item: any) => item.type === 'course');

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30 overflow-x-hidden pt-20 pb-40">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 max-w-2xl mx-auto px-6 text-center space-y-12">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-emerald-500/20"
                >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </motion.div>

                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-white tracking-tightest leading-none uppercase italic">Payment Success</h1>
                    <p className="text-xl text-zinc-500 font-medium">Your assets are ready. We've also sent the details to <span className="text-white">{order.customerEmail}</span>.</p>
                </div>

                {/* Main Action Area */}
                <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] space-y-8 text-left relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[80px] -mr-16 -mt-16" />

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tightest">Your Purchase</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Order #{order.orderNumber}</p>
                        </div>
                        <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">PAID</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-5 bg-black/40 rounded-[2rem] border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                                    {item.type === 'course' ? <Play className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold">{item.name}</h4>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{item.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 space-y-4">
                        {isCourse ? (
                            <Link
                                href="/learn/dashboard"
                                className="w-full bg-indigo-500 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3 group"
                            >
                                Start Learning Now
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {order.metadata?.downloadLinks?.map((link: any, i: number) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        download
                                        target="_blank"
                                        className="w-full bg-white text-black py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5 flex items-center justify-center gap-3 group"
                                    >
                                        Download {link.name}
                                        <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-8 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] flex flex-col items-center gap-3">
                        <Mail className="w-6 h-6 text-zinc-600" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Delivery</span>
                        <p className="text-xs font-bold text-zinc-700 text-center">Check your inbox for receipt & download backup.</p>
                    </div>
                    <div className="p-8 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] flex flex-col items-center gap-3">
                        <Shield className="w-6 h-6 text-zinc-600" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Secure Files</span>
                        <p className="text-xs font-bold text-zinc-700 text-center">Encoded via 256-bit SSL for maximum protection.</p>
                    </div>
                </div>

                <div className="pt-8">
                    <Link href="/" className="text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                        Back to Creator Storefront
                    </Link>
                </div>
            </main>
        </div>
    );
}
