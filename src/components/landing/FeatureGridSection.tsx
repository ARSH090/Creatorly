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
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-900/50 hover:border-white/10 transition-all duration-300 group"
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.border} border flex items-center justify-center ${feature.color} mb-6`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureGridSection;
