'use client';

import React from 'react';
import { Store, CreditCard, BarChart3, Globe, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureGridSection: React.FC = () => {
    const features = [
        {
            icon: Store,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
            title: "Digital Storefront",
            desc: "Sell e-books, courses, presets, and consultations directly. No website needed."
        },
        {
            icon: CreditCard,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            title: "Instant UPI Payouts",
            desc: "Accept payments via UPI, Cards, and Netbanking. Money hits your bank instantly."
        },
        {
            icon: BarChart3,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            title: "Deep Analytics",
            desc: "Know exactly which post drove the sale. Track conversion rates and visitor geography."
        },
        {
            icon: Globe,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            title: "Custom Domains",
            desc: "Connect your-name.com for fully branded authority. Free SSL included."
        },
        {
            icon: Mail,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20",
            title: "Email Marketing",
            desc: "Collect emails with every purchase. Send newsletters to your community directly."
        },
        {
            icon: Lock,
            color: "text-zinc-400",
            bg: "bg-zinc-500/10",
            border: "border-zinc-500/20",
            title: "Secure & Private",
            desc: "We handle the tech security, compliance, and file delivery so you can sleep easy."
        }
    ];

    return (
        <section id="features" className="py-24 px-6 bg-[#030303]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-5xl font-semibold tracking-tighter text-white mb-6">Everything you need <br /><span className="text-zinc-500">to run a creator business.</span></h2>
                    <p className="text-zinc-400 text-lg">Powerful enough for pros, simple enough for everyone.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                            className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 overflow-hidden shadow-2xl shadow-black/50 transition-all duration-300 group relative"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Top Edge Highlight */}
                            <motion.div
                                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            />

                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
                            
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.border} border flex items-center justify-center ${feature.color} mb-6`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureGridSection;
