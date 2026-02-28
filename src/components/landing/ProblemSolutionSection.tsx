'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const ProblemSolutionSection: React.FC = () => {
    return (
        <section className="py-24 px-6 bg-[#050505] border-t border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">You create content. <br /><span className="text-zinc-500">Why struggle with tools?</span></h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto">Stop stitching together 10 different apps. Creatorly unifies your entire business.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-12 relative">
                    {/* Divider Line for Desktop */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2" />

                    {/* The Struggle */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-red-400 mb-8 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            The Old Way
                        </h3>

                        {[
                            "Paying for Linktree, Shopify, and Mailchimp separately.",
                            "Manual DM replies to send payment links.",
                            "Losing 5-10% in platform fees + transaction fees.",
                            "Zero data on who your actual superfans are."
                        ].map((item, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 flex gap-4 items-start"
                            >
                                <div className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mt-0.5">
                                    <X className="w-3 h-3" />
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed">{item}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* The Solution */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-emerald-400 mb-8 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            The Creatorly Way
                        </h3>

                        {[
                            "One simple link for Bio, Store, and Email list.",
                            "Automated instant delivery of digital products.",
                            "0% platform fees on the Pro plan. You keep it all.",
                            "Deep analytics and own your customer data forever."
                        ].map((item, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4 items-start"
                            >
                                <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mt-0.5">
                                    <Check className="w-3 h-3" />
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed">{item}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProblemSolutionSection;
