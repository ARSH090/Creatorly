'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

export default function ComparisonSection() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    const features = [
        { name: 'Store Builder', creatorly: true, stanStore: true, linktree: false },
        { name: 'Digital Products', creatorly: true, stanStore: true, linktree: false },
        { name: 'Email Marketing', creatorly: true, stanStore: false, linktree: false },
        { name: 'Course Hosting', creatorly: true, stanStore: true, linktree: false },
        { name: 'Affiliate System', creatorly: true, stanStore: false, linktree: false },
        { name: 'Analytics', creatorly: true, stanStore: true, linktree: true },
        { name: 'AI Tools', creatorly: true, stanStore: false, linktree: false },
        { name: 'Custom Domain', creatorly: true, stanStore: 'paid', linktree: 'paid' },
        { name: 'Automation Workflows', creatorly: true, stanStore: false, linktree: false },
        { name: 'Transaction Fee (Pro)', creatorly: '0%', stanStore: '5%', linktree: 'N/A' },
    ];

    const FeatureCell = ({ value }: { value: boolean | string }) => {
        if (value === true) {
            return <div className="flex justify-center"><Check className="w-5 h-5 text-emerald-400" /></div>;
        }
        if (value === false) {
            return <div className="flex justify-center"><X className="w-5 h-5 text-zinc-600" /></div>;
        }
        if (value === 'paid') {
            return <div className="flex justify-center items-center"><span className="text-xs text-zinc-400">💰 Paid</span></div>;
        }
        return <div className="flex justify-center items-center"><span className="text-sm font-semibold text-white">{value}</span></div>;
    };

    return (
        <section className="py-24 md:py-32 bg-[#030303] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/10 via-transparent to-transparent pointer-events-none" />

            <motion.div
                className="container mx-auto px-6 relative z-10"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
            >
                {/* Section Header */}
                <motion.div className="text-center mb-16" variants={itemVariants}>
                    <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        Why Creators Choose Creatorly
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        The Honest Comparison
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        See how Creatorly stacks up against standalone alternatives. We built everything from the ground up — no integration chaos, no monthly platform fees.
                    </p>
                </motion.div>

                {/* Comparison Table */}
                <motion.div
                    className="overflow-x-auto"
                    variants={itemVariants}
                >
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-6 px-4 md:px-6 text-white font-semibold">Feature</th>
                                <th className="text-center py-6 px-4 md:px-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-white font-bold">Creatorly</span>
                                        <span className="text-xs text-emerald-400 font-semibold">✓ All-in-One</span>
                                    </div>
                                </th>
                                <th className="text-center py-6 px-4 md:px-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-zinc-300 font-semibold">Stan Store</span>
                                        <span className="text-xs text-zinc-600">$29+/mo</span>
                                    </div>
                                </th>
                                <th className="text-center py-6 px-4 md:px-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-zinc-300 font-semibold">Linktree Pro</span>
                                        <span className="text-xs text-zinc-600">$24+/mo</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((feature, idx) => (
                                <motion.tr
                                    key={feature.name}
                                    className="border-b border-white/5 hover:bg-white/2 transition-colors"
                                    variants={itemVariants}
                                >
                                    <td className="py-6 px-4 md:px-6">
                                        <span className="text-white font-medium">{feature.name}</span>
                                    </td>
                                    <td className="py-6 px-4 md:px-6">
                                        <FeatureCell value={feature.creatorly} />
                                    </td>
                                    <td className="py-6 px-4 md:px-6">
                                        <FeatureCell value={feature.stanStore} />
                                    </td>
                                    <td className="py-6 px-4 md:px-6">
                                        <FeatureCell value={feature.linktree} />
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>

                {/* CTA Section Below Table */}
                <motion.div
                    className="mt-16 text-center"
                    variants={itemVariants}
                >
                    <p className="text-zinc-400 mb-8 text-lg">
                        Stop juggling 5+ platforms. Start earning more with one unified creator business platform.
                    </p>
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-105 uppercase tracking-[0.1em] text-sm"
                    >
                        Make the Switch Today
                        <span>→</span>
                    </Link>
                    <p className="text-xs text-zinc-600 mt-4">✓ Free forever plan • No transaction fees • Cancel anytime</p>
                </motion.div>

                {/* Trust Statement */}
                <motion.div
                    className="mt-12 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-center"
                    variants={itemVariants}
                >
                    <p className="text-sm text-zinc-300">
                        <span className="text-indigo-400 font-semibold">We're honest about what we do.</span> If you're using Creatorly for just email, Mailchimp might be cheaper. But if you're building a real creator business? You'll save thousands per year consolidating tools.
                    </p>
                </motion.div>
            </motion.div>
        </section>
    );
}
