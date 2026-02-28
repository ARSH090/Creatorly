'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { UserPlus, Link as LinkIcon, ShoppingBag, TrendingUp } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
    const steps = [
        {
            image: "/landing-success.png",
            title: "Sign Up",
            desc: "Create your free account in 30 seconds."
        },
        {
            image: "/logo.png",
            title: "Claim Link",
            desc: "Get your custom creatorly.link/username."
        },
        {
            image: "/landing-store.png",
            title: "Add Products",
            desc: "List digital downloads or services."
        },
        {
            image: "/landing-analytics.png",
            title: "Monetize",
            desc: "Share your link and start earning."
        }
    ];

    return (
        <section id="how-it-works" className="py-24 px-6 bg-black relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-3xl sm:text-5xl font-semibold tracking-tighter text-white mb-6">From zero to sales<br />in four simple steps.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent dashed-line" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="relative flex flex-col items-center text-center group"
                        >
                            {/* Icon Container */}
                            <div className="w-24 h-24 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 group-hover:shadow-[0_0_50px_rgba(99,102,241,0.2)] transition-all duration-500 z-10 mb-8 relative">
                                <Image
                                    src={step.image}
                                    alt={step.title}
                                    width={120}
                                    height={120}
                                    className="object-contain transform group-hover:scale-110 transition-transform duration-500 p-4"
                                />
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Step Number - Redesigned to be less intrusive */}
                            <div className="absolute top-0 right-0 text-7xl font-black text-white/[0.03] pointer-events-none select-none -translate-y-8 translate-x-8 italic">
                                0{index + 1}
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed px-4">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
