'use client';

import React from 'react';
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="relative overflow-hidden min-h-screen flex items-center bg-[#030303]">
            {/* Background Gradient - Adapted for Dark Mode to match existing theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-[#030303] to-purple-950/20" />

            {/* Animated Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {mounted && [...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-indigo-500/30 rounded-full"
                        initial={{
                            x: Math.random() * 1000,
                            y: Math.random() * 1000
                        }}
                        animate={{
                            y: [0, -20, 0],
                            x: [0, Math.sin(i) * 10, 0],
                            opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: i * 0.1,
                        }}
                    />
                ))}
            </div>

            <div className="container relative mx-auto px-6 py-32 md:py-48">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column - Content */}
                    <div>
                        {/* Trust Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/10"
                        >
                            <Shield className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-medium text-zinc-300">
                                Trusted by 10,000+ Indian Creators
                            </span>
                        </motion.div>

                        {/* Main Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight text-white leading-[1.1]"
                        >
                            <span className="block">Monetize Your</span>
                            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Indian Audience
                            </span>
                        </motion.h1>

                        {/* Subheading */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="text-xl text-zinc-400 mb-10 max-w-lg leading-relaxed"
                        >
                            The only platform where Indian creators build mobile-first stores that
                            <span className="font-semibold text-indigo-400"> actually convert fans into paying customers.</span>
                            <br />No coding. Just selling.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4 mb-12"
                        >
                            <Link
                                href="/auth/register"
                                className="group inline-flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-8 rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] transition-all duration-300"
                            >
                                <span>Start Free for 14 Days</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/u/demo"
                                className="inline-flex items-center justify-center gap-3 bg-white/5 text-white font-semibold py-4 px-8 rounded-full border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
                            >
                                <Zap className="w-5 h-5 text-indigo-400" />
                                <span>View Live Demo Store</span>
                            </Link>
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-4"
                        >
                            <p className="text-zinc-500 text-sm font-medium">Revenue generated this week:</p>
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className={`w-12 h-12 rounded-full border-4 border-[#030303] bg-gradient-to-br ${i === 1 ? 'from-purple-500 to-indigo-500' : i === 2 ? 'from-pink-500 to-rose-500' : i === 3 ? 'from-orange-500 to-amber-500' : 'from-emerald-500 to-teal-500'}`}
                                        />
                                    ))}
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">₹42,78,950+</p>
                                    <p className="text-sm text-zinc-500">across 10,000+ creators</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Interactive Demo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="relative lg:h-[600px] flex items-center justify-center cursor-default"
                    >
                        {/* Floating Phone Mockup */}
                        <div className="relative mx-auto w-80">
                            {/* Phone Frame */}
                            <div className="relative bg-zinc-900 rounded-[3rem] p-4 shadow-2xl border border-white/10">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-20" />

                                {/* Screen Content */}
                                <div className="bg-[#f5f5f5] rounded-[2.2rem] overflow-hidden h-[580px] relative">
                                    {/* Store Header */}
                                    <div className="p-6 bg-indigo-600 pb-12">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md" />
                                            <div>
                                                <div className="w-24 h-4 bg-white/20 rounded-full mb-2" />
                                                <div className="w-16 h-3 bg-white/20 rounded-full" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Grid - Overlapping header */}
                                    <div className="px-4 -mt-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                                                    <div className={`aspect-square rounded-lg mb-2 ${i % 2 === 0 ? 'bg-purple-100' : 'bg-pink-100'}`} />
                                                    <div className="w-full h-3 bg-zinc-100 rounded mb-1" />
                                                    <div className="w-12 h-3 bg-zinc-100 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Success Toast */}
                                    <motion.div
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 1.5, duration: 0.5 }}
                                        className="absolute bottom-6 left-4 right-4 bg-zinc-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl border border-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">₹499 received!</p>
                                                <p className="text-xs text-zinc-400">Payment successful</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-12 -right-12 bg-zinc-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 min-w-[160px]"
                            >
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">₹24,580</p>
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">earned today</p>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute top-1/2 -left-20 bg-zinc-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                    <Zap className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">New Subscriber</p>
                                    <p className="text-xs text-zinc-400">via Instagram</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
