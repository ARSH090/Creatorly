'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Link as LinkIcon, ShoppingBag, TrendingUp } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
    const steps = [
        {
            icon: UserPlus,
            title: "Sign Up",
            desc: "Create your free account in 30 seconds."
        },
        {
            icon: LinkIcon,
            title: "Claim Link",
            desc: "Get your custom creatorly.link/username."
        },
        {
            icon: ShoppingBag,
            title: "Add Products",
            desc: "List digital downloads or services."
        },
        {
            icon: TrendingUp,
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
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-300 z-10 mb-6">
                                <step.icon className="w-6 h-6" />
                            </div>

                            {/* Step Number */}
                            <div className="absolute -top-6 text-[100px] font-bold text-zinc-900/50 -z-10 select-none">
                                {index + 1}
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
